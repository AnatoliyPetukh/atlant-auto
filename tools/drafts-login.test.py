# Live HTTPS login regression test. Reads ignored local credentials; never prints them.
# Requires the seeded demo receipt in _backups/drafts-storage-test.json. Does not publish or change car data.
from pathlib import Path
import json,urllib.request,urllib.error,urllib.parse,http.cookiejar,re,base64
ROOT=Path(__file__).resolve().parents[1];auth=json.loads((ROOT/'.presentation-access.json').read_text());a=json.loads((ROOT/'.telegram-employee-access.json').read_text());test=json.loads((ROOT/'_backups/drafts-storage-test.json').read_text())
BASE='https://serwer2454127.home.pl';jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
bare=urllib.request.build_opener(NoRedirect())
def request(path,opener=client,data=None,headers=None):
 body=urllib.parse.urlencode(data).encode() if isinstance(data,dict) else data
 try:
  with opener.open(urllib.request.Request(BASE+path,data=body,headers=headers or {}),timeout=25) as r:return r.status,r.read().decode(errors='replace'),r.headers
 except urllib.error.HTTPError as e:return e.code,e.read().decode(errors='replace'),e.headers

def check(ok,label):
 if not ok:raise RuntimeError(label)
 print('PASS '+label,flush=True)
code,body,h=request('/drafts/',bare);check(code==302 and h.get('Location','').startswith('/drafts/login.php') and not h.get('WWW-Authenticate'),'guest redirected to HTML login without Basic challenge')
code,body,h=request('/drafts/');check(code==200 and 'Вход в черновики' in body and '<form' in body,'login form loads normally')
csrf=re.search(r'name="csrf" value="([a-f0-9]+)"',body)[1]
cookies=list(jar);check(len(cookies)==1 and cookies[0].secure and cookies[0].path=='/drafts/' and cookies[0].has_nonstandard_attr('HttpOnly') and cookies[0].get_nonstandard_attr('SameSite')=='Lax','Secure HttpOnly SameSite cookie scoped to drafts')
initial=cookies[0].value
code,body,h=request('/drafts/login.php',data={'username':auth['username'],'password':auth['password']});check(code==400 and 'устарела' in body,'login POST requires CSRF')
code,body,h=request('/drafts/login.php',data={'username':auth['username'],'password':'wrong-test-password','csrf':csrf});check(code==200 and 'Неверный' in body and not h.get('WWW-Authenticate'),'wrong password safely rejected without browser auth error')
code,body,h=request('/drafts/login.php',data={'username':auth['username'],'password':auth['password'],'csrf':csrf,'next':'https://example.com/unsafe'});check(code==200 and 'ERP · реестр автомобилей' in body and auth['password'] not in body,'existing password logs in; unsafe redirect discarded')
check(list(jar)[0].value!=initial,'session ID rotated on login')
code,body,h=request('/drafts/?id='+test['id']);check(code==200 and test['vin'] in body,'authenticated draft detail loads')
csrf=re.search(r'name="csrf" value="([a-f0-9]+)"',body)[1]
code,body,h=request('/drafts/?asset='+test['asset_ids'][0]);check(code==200 and h.get('Content-Type','').startswith('image/'),'session protects photo download')
code,body,h=request('/drafts/?asset='+test['asset_ids'][0],bare);check(code==302,'anonymous photo remains protected')
code,body,h=request('/drafts/login.php',data={'action':'logout','csrf':'invalid'});check(code==400,'logout CSRF rejected')
code,body,h=request('/drafts/');check(code==200 and 'ERP · реестр автомобилей' in body,'invalid logout does not destroy valid session')
code,body,h=request('/drafts/login.php',data={'action':'logout','csrf':csrf});check(code==200 and 'Вход в черновики' in body,'logout invalidates session')
code,body,h=request('/drafts/');check(code==200 and 'Вход в черновики' in body,'logged-out client cannot reopen drafts')
for path in ['/.atlant-internal/draft-sessions/','/.atlant-internal/draft-auth-rates/','/internal-api/draft-viewer-auth.php','/drafts/.htaccess','/drafts/index.php.new']:
 code,_,_=request(path,bare);check(code in (403,404),'internal path denied '+path)
code,_,_=request('/internal-api/vehicle-drafts.php',bare,headers={'Authorization':'Bearer '+a['access_key']});check(code==200,'extension API still uses employee key')
print('All server-side login integration tests passed.',flush=True)
