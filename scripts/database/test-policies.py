"""Real PostgreSQL policy tests on a disposable local-only Unix socket database.
Start a temporary PostgreSQL cluster on /private/tmp socket, port 55439 first.
Never accepts a remote database URL or credentials.
"""
import argparse, subprocess, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--socket-dir', default='/private/tmp')
args = parser.parse_args()
assert args.socket_dir.startswith('/'), 'Only local Unix socket paths are accepted'
BASE = ['psql', '-X', '-h', args.socket_dir, '-p', '55439', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At']
def sql(statement, db='postgres', ok=True):
    r = subprocess.run(BASE + ['-d', db, '-c', statement], capture_output=True, text=True)
    if (r.returncode == 0) != ok:
        raise AssertionError(r.stderr + '\n' + statement)
    return r.stdout.strip()
for role in ['anon', 'authenticated', 'service_role']:
    if sql(f"SELECT count(*) FROM pg_roles WHERE rolname='{role}'") == '0':
        sql(f'CREATE ROLE {role} NOLOGIN' + (' BYPASSRLS' if role == 'service_role' else ''))
for legacy in [False, True]:
    db = 'pwa_policy_' + str(time.time_ns())
    sql('CREATE DATABASE ' + db)
    def apply(path):
        r = subprocess.run(BASE + ['-d', db, '-f', str(path)], capture_output=True, text=True)
        if r.returncode: raise AssertionError(str(path) + '\n' + r.stderr)
    apply(ROOT / 'scripts/database/bootstrap-test.sql')
    migrations = sorted((ROOT / 'supabase/migrations').glob('*.sql'))
    for p in migrations:
        if p.name.endswith('production_policy_hardening.sql') and legacy:
            apply(ROOT / 'drizzle/migrations/0000_lock_public_audits.sql')
        apply(p)
    for table, constraint in [('portfolio_audits','audits_user_fk'),('public_audits','public_audits_user_fk'),('public_audits','public_audits_audit_fk'),('deal_inquiries','inquiries_seller_fk'),('deal_inquiries','inquiries_portfolio_fk'),('subscriptions','subscriptions_user_fk'),('pricing_waitlist','waitlist_user_fk')]:
        sql(f'ALTER TABLE public.{table} VALIDATE CONSTRAINT {constraint}', db)
    A='11111111-1111-4111-8111-111111111111'; B='22222222-2222-4222-8222-222222222222'; ADMIN='33333333-3333-4333-8333-333333333333'
    PA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; PB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; AA='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    sql(f"INSERT INTO auth.users(id,email) VALUES ('{A}','a@test.invalid'),('{B}','b@test.invalid'),('{ADMIN}','larsenevans@proton.me'); INSERT INTO public.user_roles(user_id,role) VALUES ('{ADMIN}','admin'); INSERT INTO public.portfolio(id,user_id,name,for_sale) VALUES ('{PA}','{A}','A',true),('{PB}','{B}','B',true);", db)
    def user(uid, query, ok=True):
        return sql(f"SET ROLE authenticated; SET request.jwt.claim.sub='{uid}'; {query}", db, ok).splitlines()[-1]
    assert user(A,'SELECT count(*) FROM public.portfolio') == '1'
    assert user(B,'SELECT count(*) FROM public.portfolio') == '1'
    assert sql('SET ROLE anon; SELECT count(*) FROM public.portfolio',db).splitlines()[-1] == '0'
    assert user(ADMIN,'SELECT count(*) FROM public.portfolio') == '2'
    user(A,f"INSERT INTO public.portfolio_audits(id,user_id,portfolio_id,inputs,ai_report) VALUES ('{AA}','{A}','{PA}','{{}}','{{}}')")
    user(B,f"INSERT INTO public.portfolio_audits(user_id,portfolio_id,inputs,ai_report) VALUES ('{B}','{PA}','{{}}','{{}}')",False)
    user(A,f"INSERT INTO public.public_audits(audit_id,user_id,slug,app_name) VALUES ('{AA}','{A}','secret-slug','A')")
    assert user(B,'SELECT count(*) FROM public.public_audits') == '0'
    sql('SET ROLE anon; SELECT * FROM public.public_audits',db,False)
    user(B,f"INSERT INTO public.public_audits(audit_id,user_id,slug,app_name) VALUES ('{AA}','{B}','forged','A')",False)
    user(B,f"INSERT INTO public.deal_inquiries(portfolio_id,seller_user_id,buyer_email,message) VALUES ('{PA}','{A}','b@test.invalid','hello seller')")
    user(B,f"INSERT INTO public.deal_inquiries(portfolio_id,seller_user_id,buyer_email,message) VALUES ('{PA}','{B}','b@test.invalid','forged seller')",False)
    sql(f"SET ROLE anon; INSERT INTO public.deal_inquiries(portfolio_id,seller_user_id,buyer_email,message) VALUES ('{PA}','{A}','x@test.invalid','hello seller')",db,False)
    assert user(A,'SELECT count(*) FROM public.deal_inquiries') == '1'
    assert user(B,'SELECT count(*) FROM public.deal_inquiries') == '0'
    user(B,f"INSERT INTO public.user_roles(user_id,role) VALUES ('{B}','admin')",False)
    user(A,f"UPDATE public.portfolio SET user_id='{B}' WHERE id='{PA}'",False)
    assert user(B,f"WITH changed AS (DELETE FROM public.portfolio WHERE id='{PA}' RETURNING id) SELECT count(*) FROM changed") == '0'
    assert user(B,f"SELECT public.has_role('{ADMIN}', 'admin')") == 'f'
    sql("SET ROLE anon; SELECT public.reserve_ai_audit('blocked-key',1)",db,False)
    user(A,"SELECT public.reserve_ai_audit('blocked-key',1)",False)
    with ThreadPoolExecutor(max_workers=12) as pool:
        results=list(pool.map(lambda _: sql("SET ROLE service_role; SELECT public.reserve_ai_audit('concurrent-ip',1)",db).splitlines()[-1], range(12)))
    assert results.count('t') == 1, results
    assert results.count('f') == 11, results
    sql(f"INSERT INTO public.pricing_waitlist(user_id,email,tier) VALUES ('{A}','a@test.invalid','pro')", db)
    sql(f"DELETE FROM auth.users WHERE id='{A}'",db)
    assert sql("SELECT count(*) FROM public.pricing_waitlist WHERE email='a@test.invalid' AND user_id IS NULL", db) == '1'
    print('Waitlist retention: PASS (e-mail retained and user link cleared)')
    assert user(A,'SELECT count(*) FROM public.portfolio_audits') == '0'
    assert sql("SELECT count(*) FROM public.public_audits",db) == '0'
    assert sql("SELECT count(*) FROM public.deal_inquiries",db) == '0'
    print('Deletion cascades: PASS (audit, publication and inquiry removed)')
    print('Atomic quota: PASS (12 concurrent reservations, exactly 1 allowed; anon/user RPC denied)')
    print(('legacy Drizzle + forward' if legacy else 'clean Supabase history') + ': PASS (user/admin/anon isolation assertions)')
