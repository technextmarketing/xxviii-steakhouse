import subprocess
names = subprocess.run(['git','diff','--name-only'],capture_output=True,text=True).stdout.split()
n=0
for p in names:
    if not p.endswith(('.html','.js','.css','.py','.json','.txt','.md')): continue
    old = subprocess.run(['git','show','HEAD:'+p],capture_output=True).stdout
    new = open(p,'rb').read()
    crlf_old = b'\r\n' in old
    if not crlf_old and b'\r\n' in new: new = new.replace(b'\r\n', b'\n'); n+=1
    elif crlf_old and b'\r\n' not in new: new = new.replace(b'\n', b'\r\n'); n+=1
    new = new.replace(b'\x08(\d{1,2}', b'\b(\d{1,2}').replace(b'(Am|Pm)\x08', b'(Am|Pm)\b')
    open(p,'wb').write(new)
print('eol fixed', n)
