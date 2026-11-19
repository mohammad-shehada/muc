from pathlib import Path
import json,hashlib,re
R=Path(__file__).resolve().parents[1];P=R/'dist/papers'
def read(name,prefix):return json.loads((P/name).read_text()[len(prefix):-1])
d=read('data.js','window.EXAM_DATA=');c=read('course-data.js','window.ORIGINAL_COURSE=')
subjects=[dict(id='networks',title='موضوعات خاصة في الشبكات',short='الشبكات',symbol='⌁',color='#488cdb',packs=[t['id'] for t in d['topics']],desc='مادة الشبكات كاملة · الأسابيع ١–٥',full=True),dict(id='modern',title='الشبكات الحديثة',short='الحديثة',symbol='◈',color='#5d82e4',packs=['foundations','challenges'],desc='الأسبوع الأول · الأساسيات والتحديات'),dict(id='architecture',title='معمارية الشبكات',short='المعمارية',symbol='▦',color='#9d72d3',packs=['architecture'],desc='الأسبوع الثاني · التصميم والتقسيم'),dict(id='availability',title='موثوقية وإتاحة الشبكات',short='الموثوقية',symbol='◷',color='#48a896',packs=['availability'],desc='الأسبوع الثالث · القياس والحسابات'),dict(id='ha',title='الإتاحة العالية',short='الإتاحة',symbol='⇄',color='#e6a14e',packs=['ha'],desc='الأسبوع الرابع · HA وFailover'),dict(id='resilience',title='مرونة الشبكات',short='المرونة',symbol='✧',color='#dc7890',packs=['resilience'],desc='الأسبوع الخامس · Resilience والتعافي')]
for s in subjects:
 s['chapters']=[x['id'] for doc in c['documents'] for x in doc['chapters'] if x['pack'] in s['packs']]
 s['exams']=[e['id'] for e in d['exams'] if any(e['title']==t['title'] and t['id'] in s['packs'] for t in d['topics'])]
(P/'app.js').write_text((P/'app.js').read_text().replace('networks-','muc-papers-'))
for name in ['index.html','experience.js','lessons.js']:
 p=P/name;p.write_text(p.read_text().replace('networks-','muc-papers-'))
(R/'dist/catalog.js').write_text('window.MUC_CATALOG='+json.dumps(dict(subjects=subjects,source='networks-weekly-exams-ar',examCount=len(d['exams']),questionCount=sum(len(e['questions']) for e in d['exams']),chapterCount=sum(len(doc['chapters']) for doc in c['documents'])),ensure_ascii=False)+';')
assert len(d['exams'])==42
for e in d['exams']:assert sum(q['marks'] for q in e['questions'])==40
print('Verified isolated copy:42 exams,1344 questions,109 sections. Original repository is read-only.')
