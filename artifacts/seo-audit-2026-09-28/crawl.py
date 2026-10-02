"""Read-only local SEO audit. Uses only GET; no forms or external links followed."""
from html.parser import HTMLParser
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit, unquote
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json, re, time, hashlib, xml.etree.ElementTree as ET

BASE = 'http://localhost:3000'
OUT = Path(__file__).resolve().parent
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None

def fetch(path, ua='SEO-local-read-only-audit/1.0', headers=None, redirects=True):
    request = Request(urljoin(BASE, path), headers={'User-Agent':ua, **(headers or {})})
    start = time.monotonic()
    try:
        response = (urlopen(request, timeout=60) if redirects else build_opener(NoRedirect()).open(request, timeout=60))
    except HTTPError as error: response = error
    data = response.read()
    return {'path':path, 'status':response.status, 'headers':dict(response.headers),
            'bytes':len(data), 'elapsed_ms':round((time.monotonic()-start)*1000),
            'html':data.decode('utf-8', errors='replace')}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.meta=[]; self.links=[]; self.images=[]; self.scripts=[]
        self.headings=[]; self.text=[]; self.article=[]; self.ids=[]; self.jsonld=[]
        self.title=''; self.lang=''; self.canonical=[]; self.details=0; self.json_errors=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag=='html': self.lang=attrs.get('lang')
        if tag=='meta': self.meta.append(attrs)
        if tag=='a': self.links.append(attrs)
        if tag=='img': self.images.append(attrs)
        if tag=='link' and attrs.get('rel')=='canonical': self.canonical.append(attrs.get('href'))
        if tag=='script' and attrs.get('src'): self.scripts.append(attrs['src'])
        if re.fullmatch('h[1-6]',tag): self.headings.append({'level':tag,'text':''})
        if tag=='details': self.details+=1
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append((tag,attrs,[]))
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:
                _,attrs,parts=self.stack[i]
                if tag=='script' and attrs.get('type')=='application/ld+json':
                    try: self.jsonld.append(json.loads(''.join(parts)))
                    except Exception as error: self.json_errors.append(str(error))
                self.stack=self.stack[:i]; break
    def handle_data(self,data):
        if self.stack: self.stack[-1][2].append(data)
        tags=[item[0] for item in self.stack]
        if 'title' in tags: self.title+=data
        if any(x in tags for x in ['script','style','noscript','title','svg']): return
        if self.headings and any(re.fullmatch('h[1-6]',t) for t in tags): self.headings[-1]['text']+=data
        if data.strip(): self.text.append(data.strip())
        if 'article' in tags and data.strip(): self.article.append(data.strip())

def inspect(path, ua='SEO-local-read-only-audit/1.0'):
    response=fetch(path,ua)
    parser=Page(); parser.feed(response.pop('html'))
    response.update({k:v for k,v in parser.__dict__.items() if k in ['meta','links','images','scripts','headings','ids','jsonld','title','lang','canonical','details','json_errors']})
    response['text']=' '.join(parser.text); response['article']=' '.join(parser.article)
    response['word_count']=len(response['text'].split())
    return response

robots=fetch('/robots.txt'); sitemap=fetch('/sitemap.xml')
paths=[urlsplit(e.text).path for e in ET.fromstring(sitemap['html']).iter() if e.tag.endswith('loc')]
with ThreadPoolExecutor(max_workers=3) as pool: pages=list(pool.map(inspect,paths))
for page in pages: print(page['status'],page['path'],page['word_count'],'words',flush=True)
by_path={p['path']:p for p in pages}
broken=[]; incoming={p:[] for p in paths}; external=set(); image_paths=set()
for page in pages:
    for link in page['links']:
        href=link.get('href',''); target=urlsplit(urljoin(BASE+page['path'],href))
        if target.scheme not in ['http','https']: continue
        if target.netloc not in ['localhost:3000','posadmin.ru']:
            external.add(href); continue
        if target.path in incoming: incoming[target.path].append(page['path'])
        if target.path not in by_path: broken.append([page['path'],href,'not in sitemap'])
        elif target.fragment and unquote(target.fragment) not in by_path[target.path]['ids']:
            broken.append([page['path'],href,'missing anchor'])
    for img in page['images']:
        if img.get('src','').startswith('/'): image_paths.add(img['src'])
with ThreadPoolExecutor(max_workers=3) as pool: image_results=list(pool.map(fetch,sorted(image_paths)))
image_results=[{k:v for k,v in r.items() if k!='html'} for r in image_results]
checks=[]
for path in ['/missing-seo-audit','/services/missing-seo-audit','/admin','/api/callback','/services?utm_source=seo-audit','/services/','/opengraph-image','/icon.svg']:
    r=fetch(path,redirects=False)
    if 'text/html' in r['headers'].get('Content-Type',''):
        p=Page(); p.feed(r['html']); r.update({'canonical':p.canonical,'meta':p.meta,'title':p.title})
    r.pop('html'); checks.append(r)
redirect=fetch('/services?utm_source=seo-audit',headers={'Host':'www.posadmin.ru'},redirects=False); redirect.pop('html')
ua_checks=[]
for ua in ['Mozilla/5.0','Googlebot','YandexBot']:
    p=inspect('/services/soprovozhdenie-r-keeper',ua)
    ua_checks.append({'ua':ua,'status':p['status'],'title':p['title'],'canonical':p['canonical'],
                      'article_sha256':hashlib.sha256(p['article'].encode()).hexdigest(),'article_words':len(p['article'].split())})
result={'date':'2026-09-28','origin':BASE,'scope':'local development; GET only; no external pages requested',
        'robots':robots,'sitemap':sitemap,'pages':pages,'broken_internal':broken,'incoming':incoming,
        'external_links':sorted(external),'images':image_results,'checks':checks,'www_redirect':redirect,'ua_checks':ua_checks}
(OUT/'evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages':len(pages),'broken_internal':broken,'images':len(image_results),
 'image_failures':[[i['path'],i['status']] for i in image_results if i['status']!=200],
 'checks':[[c['path'],c['status']] for c in checks],'www_redirect':redirect,'ua_checks':ua_checks},ensure_ascii=False,indent=2))
