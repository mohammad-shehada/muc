const app = document.querySelector('#app'), overlays = document.querySelector('#overlay-root');
const E = window.EXAM_DATA, C = window.ORIGINAL_COURSE, D = window.STUDY_DATA, cat = window.MUC_CATALOG;
const exams = E.exams, topics = E.topics, facts = topics.flatMap((t)=>t.facts.map((f)=>({
            ...f,
            topic: t
        }))), questions = exams.flatMap((e)=>e.questions.map((q)=>({
            ...q,
            exam: e
        })));
const chapters = C.documents.flatMap((d)=>d.chapters.map((c)=>({
            ...c,
            document: d
        }))), subjects = cat.subjects;
const factMap = new Map(facts.map((f)=>[
        f.id,
        f
    ])), qMap = new Map(questions.map((q)=>[
        q.id,
        q
    ])), chapterMap = new Map(chapters.map((c)=>[
        c.id,
        c
    ]));
const KEY = 'muc-study-v1';
let savedState = {};
try {
    savedState = JSON.parse(localStorage.getItem(KEY) || '{}');
} catch  {}
let state = {
    messages: {},
    saved: [],
    reactions: {},
    pins: {},
    archived: [],
    muted: [],
    unread: [],
    visited: [],
    deleted: [],
    quiz: {},
    revealed: {},
    drafts: {},
    caseDrafts: {},
    grades: {},
    starred: [],
    custom: [],
    cursor: {},
    level: 'beginner',
    preferences: {
        theme: 'dark',
        font: 16,
        motion: true,
        wallpaper: 'doodles',
        sounds: false
    },
    ...savedState
};
state.preferences = {
    theme: 'dark',
    font: 16,
    motion: true,
    wallpaper: 'doodles',
    sounds: false,
    ...savedState.preferences
};
let active = '', tab = 'chats', folder = 'all', query = '', chatQuery = '', replyTo = '', editId = '', busy = '', selected = [], selection = false, recording = false, mediaRecorder = null, recordStream = null, recordStart = 0, recordTimer = null, installPrompt = null;
let overlayCleanup = null, scrollPositions = {}, attachments = {};
const I = {
    back: 'M15 18l-6-6 6-6',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    more: 'M12 5h.01M12 12h.01M12 19h.01',
    send: 'M22 2 9 15 M22 2l-7 20-6-7-7-6z',
    chat: 'M21 11a8 8 0 0 1-8 8H7l-5 3v-11a9 9 0 0 1 19 0z',
    book: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4z M12 6v15',
    save: 'M6 3h12v19l-6-4-6 4z',
    settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    edit: 'M16 3l5 5-12 12-6 1 1-6z M14 5l5 5',
    pin: 'M8 3h8l-1 7 4 4H5l4-4z M12 14v8',
    reply: 'M9 5l-6 6 6 6 M3 11h9c5 0 8 3 9 8',
    forward: 'M15 5l6 6-6 6 M21 11H12c-5 0-8 3-9 8',
    check: 'M5 12l4 4L19 6',
    close: 'M6 6l12 12M18 6 6 18',
    moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12',
    sun: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    attach: 'M9 17 18 8a4 4 0 0 0-6-6L3 11a7 7 0 0 0 10 10L22 12 M6 14l9-9a1 1 0 0 1 2 2l-9 9',
    smile: 'M8 14c2 3 6 3 8 0 M8 8h.01M16 8h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    mic: 'M8 11V6a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0 M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3M8 22h8',
    file: 'M5 2h9l5 5v15H5z M14 2v6h5 M8 12h8M8 16h8',
    download: 'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',
    archive: 'M3 4h18v5H3z M5 9v12h14V9 M9 13h6',
    mute: 'M4 9h4l5-5v16l-5-5H4z M17 9l5 6M22 9l-5 6',
    copy: 'M8 8h13v13H8z M16 8V3H3v13h5',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8M14 10v8',
    plus: 'M12 5v14M5 12h14',
    chevron: 'M9 5l7 7-7 7',
    link: 'M10 14l4-4 M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
    keyboard: 'M2 5h20v14H2z M5 8h1M9 8h1M13 8h1M17 8h1M5 12h1M9 12h1M13 12h1M17 12h1M7 16h10',
    volume: 'M4 9h4l5-5v16l-5-5H4z M17 8q6 4 0 8',
    filter: 'M3 5h18M6 12h12M10 19h4',
    clock: 'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    image: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M9 7h.01'
};
const icon = (name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[name] || I.chat}"/></svg>`;
const verified = ()=>`<svg class="verified" viewBox="0 0 24 24" aria-label="حساب معتمد داخل muc" role="img"><path fill="#48a9f8" d="m12 1 2.6 2 3.3-.2 1 3.1 2.7 1.9-.8 3.2.8 3.2-2.7 1.9-1 3.1-3.3-.2-2.6 2-2.6-2-3.3.2-1-3.1-2.7-1.9.8-3.2-.8-3.2 2.7-1.9 1-3.1 3.3.2z"/><path d="m7.2 11.5 3.1 3.1 6.5-6.3" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const esc = (s)=>String(s ?? '').replace(/[&<>"']/g, (c)=>({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
const btn = (action, label, ico, id = '')=>`<button class="icon-btn" data-action="${action}" data-id="${esc(id)}" aria-label="${label}" title="${label}">${icon(ico)}</button>`;
const id = ()=>crypto.randomUUID?.() || 'm' + Date.now() + Math.random().toString(36).slice(2);
function persist() {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch  {
        toast('مساحة الحفظ ممتلئة. صدّر نسخة من تقدمك من الإعدادات.');
    }
}
function toast(text, undo) {
    const t = document.querySelector('#toast');
    t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button id="undo-toast">تراجع</button>' : ''}`;
    t.classList.add('show');
    if (undo) document.querySelector('#undo-toast').onclick = ()=>{
        undo();
        t.classList.remove('show');
    };
    clearTimeout(toast.timer);
    toast.timer = setTimeout(()=>t.classList.remove('show'), 4200);
}
const allChats = ()=>[
        {
            id: 'meorslan',
            title: 'meorslan',
            desc: 'حساب المنصة · أهلاً في مساحة دراستك',
            symbol: 'm',
            color: '#579cf0',
            official: true
        },
        {
            id: 'saved',
            title: 'الرسائل المحفوظة',
            desc: 'أسئلتك وملاحظاتك في مكان واحد',
            symbol: 'save',
            color: '#5b9fe6'
        },
        ...subjects,
        ...state.custom
    ];
const chatBy = (cid)=>allChats().find((c)=>c.id === cid);
const subjectBy = (cid)=>subjects.find((c)=>c.id === cid);
const avatar = (c, small = false)=>`<span class="avatar ${small ? 'small' : ''} ${c.official ? 'official-avatar' : ''}" style="--avatar:${c.color || '#6c88c3'}">${c.id === 'saved' ? icon('save') : c.id === 'meorslan' ? '<span>m</span>' : esc(c.symbol || c.title.slice(0, 1))}</span>`;
function applyTheme() {
    const p = state.preferences, t = p.theme === 'auto' ? matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light' : p.theme;
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.wallpaper = p.wallpaper;
    document.documentElement.dataset.motion = p.motion ? 'yes' : 'no';
    document.documentElement.style.setProperty('--reading-size', p.font + 'px');
    localStorage.setItem('muc-theme', p.theme);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#17212b' : '#ffffff');
}
function basicMessages(cid) {
    if (cid === 'meorslan') return [
        {
            id: 'meorslan:welcome',
            chat: cid,
            kind: 'welcome'
        },
        {
            id: 'meorslan:guide',
            chat: cid,
            kind: 'text',
            content: 'أهلًا في muc 👋\nكل محادثة هون جزء من مادة الشبكات الأصلية. افتح محاضرتك، اضغط على الكلمات المضيئة، وجرّب سؤالًا.\nاضغط مطوّلًا على أي رسالة للتفاعل والحفظ والرد. اسحب الرسالة للرد عليها، أو اضغط عليها مرتين لإضافة ❤️.'
        },
        {
            id: 'meorslan:source',
            chat: cid,
            kind: 'text',
            content: 'المادة جاهزة للدراسة: ٤٢ ورقة، ١٣٤٤ سؤالًا، وشرح المحاضرات الأصلية.\nالأسئلة بالإنجليزية، والترجمة والشرح بالعربي. اختَر «المواد» للبدء أو اكتب: درس، سؤال، حالة، امتحان.\nهذا حساب muc المعتمد داخل المنصة. الردود الدراسية مبنية على المحتوى المرفق.'
        }
    ];
    const s = subjectBy(cid);
    if (!s) return [];
    const q = questions.find((q)=>q.type !== 'case' && s.exams.includes(q.exam.id));
    return [
        {
            id: cid + ':welcome',
            chat: cid,
            kind: 'welcome'
        },
        {
            id: cid + ':first-lesson',
            chat: cid,
            kind: 'lesson',
            ref: s.chapters[0]
        },
        {
            id: cid + ':first-question',
            chat: cid,
            kind: 'question',
            ref: q.id
        }
    ];
}
function messages(cid) {
    if (cid === 'saved') {
        return [
            ...allMessages().filter((m)=>state.saved.includes(m.id)),
            ...state.messages.saved || []
        ].filter((m)=>!state.deleted.includes(m.id));
    }
    return [
        ...basicMessages(cid),
        ...state.messages[cid] || []
    ].filter((m)=>!state.deleted.includes(m.id));
}
function allMessages() {
    return allChats().filter((c)=>c.id !== 'saved').flatMap((c)=>messages(c.id));
}
function findMessage(mid) {
    return allMessages().find((m)=>m.id === mid) || (state.messages.saved || []).find((m)=>m.id === mid);
}
function messageText(m) {
    if (m.kind === 'lesson') {
        const c = chapterMap.get(m.ref);
        return c ? c.title + ' ' + c.beginner + ' ' + c.points.join(' ') : '';
    }
    if (m.kind === 'question') {
        const q = qMap.get(m.ref);
        return q ? q.en + ' ' + q.ar : '';
    }
    return m.content || 'ملف مرفق';
}
function add(cid, m) {
    const x = {
        id: id(),
        chat: cid,
        kind: 'text',
        stamp: Date.now(),
        ...m
    };
    (state.messages[cid] ??= []).push(x);
    persist();
    return x;
}
function openChat(cid) {
    if (!chatBy(cid)) return;
    chatQuery = '';
    query = '';
    replyTo = '';
    editId = '';
    selected = [];
    selection = false;
    if (!state.visited.includes(cid)) state.visited.push(cid);
    state.unread = state.unread.filter((x)=>x !== cid);
    persist();
    location.hash = 'chat/' + cid;
    closeOverlay();
}
function route() {
    const previous = active;
    const h = decodeURIComponent(location.hash.slice(1));
    active = h.startsWith('chat/') ? h.slice(5) : '';
    tab = active ? 'chats' : [
        'review',
        'settings',
        'saved'
    ].includes(h) ? h : 'chats';
    if (h === 'saved') {
        active = 'saved';
        tab = 'saved';
    }
    if (recording && active !== previous) {
        if (mediaRecorder) mediaRecorder.cancelled = true;
        mediaRecorder?.stop();
    }
    if (active && !chatBy(active)) {
        active = '';
        location.hash = '';
    }
    render();
}
function render() {
    applyTheme();
    app.innerHTML = `<div class="app-shell ${active ? 'has-chat' : ''} ${tab !== 'chats' ? 'tab-screen' : ''}"><aside class="inbox"><header class="inbox-header"><div><span class="brand">muc<span class="brand-dot"></span></span><span class="brand-caption">مساحة دراستك</span></div><div>${btn('theme', 'تغيير المظهر', 'moon')}${btn('new-chat', 'محادثة جديدة', 'edit')}</div></header><div class="global-search">${icon('search')}<input id="global-search" type="search" placeholder="ابحث عن مادة، درس أو رسالة" aria-label="ابحث في المواد والرسائل" value="${esc(query)}"></div><nav class="folders" aria-label="مجلدات المحادثات">${[
        [
            'all',
            'الكل'
        ],
        [
            'subjects',
            'المواد'
        ],
        [
            'unread',
            'غير المقروء'
        ],
        [
            'archive',
            'الأرشيف'
        ]
    ].map(([v, l])=>`<button data-action="folder" data-id="${v}" class="${folder === v ? 'active' : ''}">${l}${v === 'all' ? '<span>' + allChats().length + '</span>' : ''}</button>`).join('')}</nav><div class="inbox-note"><span class="mini-spark">✧</span> دراستك، على شكل محادثة</div><div id="chat-list" class="chat-list"></div><div class="inbox-footer"><span>من محاضراتك الأصلية</span><span>muc / 2026</span></div>${bottomNav()}</aside><main class="main-view">${active ? chatView() : tab === 'review' ? reviewView() : tab === 'settings' ? settingsView() : welcomeView()}</main>${!active ? `<div class="mobile-tab-nav">${bottomNav()}</div>` : ''}</div>`;
    renderChatList();
    bindInputs();
    hydrateFiles();
    if (active) {
        requestAnimationFrame(()=>{
            const feed = document.querySelector('#message-feed');
            if (feed) feed.scrollTop = scrollPositions[active] ?? 0;
        });
    }
    document.title = active ? chatBy(active)?.title + ' — muc' : 'muc — مساحة دراستك';
}
function bottomNav() {
    return `<nav class="bottom-nav" aria-label="التنقل الرئيسي">${[
        [
            'chats',
            'المحادثات',
            'chat'
        ],
        [
            'review',
            'المراجعة',
            'book'
        ],
        [
            'saved',
            'المحفوظات',
            'save'
        ],
        [
            'settings',
            'الإعدادات',
            'settings'
        ]
    ].map(([v, l, i])=>`<button data-action="tab" data-id="${v}" class="${tab === v ? 'active' : ''}">${icon(i)}<span>${l}</span>${v === 'saved' && state.saved.length ? '<i>' + state.saved.length + '</i>' : ''}</button>`).join('')}</nav>`;
}
function renderChatList() {
    const el = document.querySelector('#chat-list');
    if (!el) return;
    let list = allChats().filter((c)=>folder === 'archive' ? state.archived.includes(c.id) : !state.archived.includes(c.id)).filter((c)=>folder !== 'subjects' || !!subjectBy(c.id) || state.custom.some((x)=>x.id === c.id)).filter((c)=>folder !== 'unread' || !state.visited.includes(c.id) || state.unread.includes(c.id));
    if (query) {
        const text = query.toLowerCase();
        const chatMatches = list.filter((c)=>(c.title + ' ' + c.desc).toLowerCase().includes(text));
        const found = allMessages().filter((m)=>messageText(m).toLowerCase().includes(text)).slice(0, 25);
        el.innerHTML = `${chatMatches.map(chatRow).join('')}${found.length ? '<div class="list-section-title">رسائل ونتائج من المادة</div>' : ''}${found.map((m)=>`<button class="search-hit" data-action="jump" data-id="${m.id}"><strong>${esc(chatBy(m.chat)?.title)}</strong><span>${esc(messageText(m).slice(0, 130))}</span></button>`).join('') || '<p class="empty-state">ما في نتيجة مطابقة. جرّب مصطلحًا من المحاضرات.</p>'}`;
        return;
    }
    list.sort((a, b)=>(a.id === 'meorslan' ? -10 : b.id === 'meorslan' ? 10 : 0) + (state.pins['chat:' + a.id] ? -2 : 0) - (state.pins['chat:' + b.id] ? -2 : 0));
    el.innerHTML = list.map(chatRow).join('') || `<div class="empty-state">${icon(folder === 'archive' ? 'archive' : 'check')}<p>${folder === 'archive' ? 'الأرشيف فاضي. اضغط مطوّلًا على محادثة لأرشفتها.' : 'أنت مراجع كل المحادثات هون.'}</p></div>`;
}
function chatRow(c) {
    const ms = messages(c.id), last = ms[ms.length - 1], unread = c.id !== 'saved' && !state.visited.includes(c.id) || state.unread.includes(c.id), pinned = c.id === 'meorslan' || state.pins['chat:' + c.id];
    let preview = last?.own ? 'أنت: ' + messageText(last) : c.desc || messageText(last || {
        kind: 'text'
    });
    if (c.id === 'saved') preview = state.saved.length ? state.saved.length + ' رسالة محفوظة' : 'رسائلك المهمة، ترجع لها وقت ما بدك';
    return `<div class="chat-row ${active === c.id ? 'active' : ''}" data-chatrow="${c.id}"><button class="chat-open" data-action="chat" data-id="${c.id}">${avatar(c)}<span class="chat-row-copy"><span class="row-first"><strong dir="auto">${esc(c.title)}${c.official ? verified() : ''}</strong><small>${c.id === 'meorslan' ? 'رسمي' : subjectBy(c.id)?.full ? 'المقرر' : subjectBy(c.id) ? 'مادة' : ''}</small></span><span class="row-second"><span>${esc(preview)}</span><span class="row-indicators">${pinned ? icon('pin') : ''}${state.muted.includes(c.id) ? icon('mute') : ''}${unread ? '<i class="unread-dot" aria-label="غير مقروءة"></i>' : ''}</span></span></span></button><button class="chat-row-menu" data-action="chat-menu" data-id="${c.id}" aria-label="خيارات ${esc(c.title)}">${icon('more')}</button></div>`;
}
function welcomeView() {
    return `<section class="desktop-welcome"><div class="welcome-logo">muc<span></span></div><h1>مكانك الهادئ،<br>للفهم والمراجعة.</h1><p>افتح مادة، خذها رسالة رسالة.<br>والكلمة اللي توقفك… اضغط عليها.</p><div class="welcome-tags"><span>شرح من المادة</span><span>٤٢ ورقة امتحان</span><span>حفظ وتفاعلات</span></div><button class="primary" data-action="chat" data-id="meorslan">ابدأ من هنا ${verified()}</button><div class="welcome-line"></div><small>محتواك وتقدمك محفوظان على هذا الجهاز.</small></section>`;
}
function chatView() {
    const c = chatBy(active), s = subjectBy(active), ms = messages(active).filter((m)=>!chatQuery || messageText(m).toLowerCase().includes(chatQuery.toLowerCase())), pins = (state.pins[active] || []).filter((x)=>findMessage(x));
    const pinned = pins[0] ? findMessage(pins[0]) : null;
    return `<section class="conversation"><header class="chat-header">${btn('back', 'العودة للمحادثات', 'back')}<button class="chat-identity" data-action="profile" data-id="${active}">${avatar(c, true)}<span><strong dir="auto">${esc(c.title)}${c.official ? verified() : ''}</strong><small>${active === 'meorslan' ? 'حساب muc المعتمد' : active === 'saved' ? state.saved.length + ' رسالة محفوظة' : s ? s.full ? 'المادة كاملة · ٥ أسابيع' : 'وحدة من مادة الشبكات' : 'محادثة وملاحظات شخصية'}</small></span></button>${btn('chat-search', 'البحث في المحادثة', 'search')}${btn('chat-menu', 'خيارات المحادثة', 'more', active)}</header>${selection ? `<div class="selection-bar"><button data-action="select-cancel">إلغاء</button><strong>${selected.length} محددة</strong>${btn('selected-save', 'حفظ المحدد', 'save')}${btn('selected-forward', 'تحويل المحدد', 'forward')}${btn('selected-delete', 'إخفاء المحدد', 'trash')}</div>` : ''}<div class="chat-search-bar" id="chat-search-bar" hidden><input id="chat-search-input" placeholder="ابحث داخل هذه المحادثة" aria-label="بحث داخل المحادثة">${btn('chat-search-close', 'إغلاق البحث', 'close')}</div>${pinned ? `<button class="pinned-banner" data-action="jump" data-id="${pinned.id}">${icon('pin')}<span><strong>رسالة مثبتة ${pins.length > 1 ? '· ' + pins.length : ''}</strong><small>${esc(messageText(pinned).slice(0, 100))}</small></span></button>` : s ? `<button class="pinned-banner" data-action="toc" data-id="${active}"><span class="pinned-line"></span><span><strong>المحاضرات والامتحانات</strong><small>${s.chapters.length} مقطع شرح · ${s.exams.length} أوراق تدريب جامعية</small></span>${icon('list')}</button>` : ''}<div class="message-feed" id="message-feed" role="log" aria-label="رسائل ${esc(c.title)}"><div class="date-divider"><span>${active === 'saved' ? 'محفوظاتك' : 'محتوى المحاضرات الأصلية'}</span></div>${ms.length ? ms.map(renderMessage).join('') : `<div class="chat-empty">${icon('save')}<h2>${active === 'saved' ? 'كل اللي بدك ترجع له' : 'مساحتك الجديدة'}</h2><p>${active === 'saved' ? 'اضغط مطوّلًا على رسالة واختار «حفظ».' : 'اكتب ملاحظة أو أرفق ملفًا لبدء المحادثة.'}</p></div>`}${busy === active ? '<div class="typing"><i></i><i></i><i></i><span>يجهّز المحتوى…</span></div>' : ''}<div class="feed-end"></div></div>${ms.length > 3 ? `<button class="scroll-bottom icon-btn" data-action="bottom" aria-label="آخر المحادثة">${icon('chevron')}</button>` : ''}${s ? `<div class="quick-actions"><button data-action="next-lesson">${icon('book')} الدرس التالي</button><button data-action="next-question">${icon('chat')} سؤال جديد</button><button data-action="next-case">حالة دراسية</button><button data-action="papers">امتحان ٤٠ علامة</button></div>` : active === 'meorslan' ? `<div class="quick-actions"><button data-action="materials">المواد</button><button data-action="help">دليل التفاعلات</button><button data-action="review">الامتحانات</button></div>` : ''}<div id="reply-preview">${replyBar()}</div><footer class="composer"><div class="composer-box">${btn('emoji', 'الإيموجي والملصقات', 'smile')}<textarea id="composer-input" rows="1" placeholder="${active === 'saved' ? 'اكتب ملاحظة لنفسك…' : 'رسالة أو إجابة…'}" aria-label="اكتب رسالة">${esc(state.drafts[active] || '')}</textarea>${btn('attach', 'إرفاق ملف', 'attach')}</div><button class="send-button" data-action="send" aria-label="إرسال الرسالة">${icon('send')}</button>${btn('voice', recording ? 'إيقاف التسجيل وإرساله' : 'تسجيل رسالة صوتية', recording ? 'check' : 'mic')}</footer><div class="record-status" ${recording ? '' : 'hidden'}><i></i> تسجيل على جهازك <span id="record-time">00:00</span><button data-action="voice-cancel">إلغاء</button></div></section>`;
}
function replyBar() {
    const m = replyTo ? findMessage(replyTo) : null;
    return editId ? `<div class="reply-preview">${icon('edit')}<span><strong>تعديل رسالتك</strong></span>${btn('reply-cancel', 'إلغاء التعديل', 'close')}</div>` : m ? `<div class="reply-preview">${icon('reply')}<span><strong>رد على ${m.own ? 'رسالتك' : esc(chatBy(m.chat)?.title)}</strong><small>${esc(messageText(m).slice(0, 85))}</small></span>${btn('reply-cancel', 'إلغاء الرد', 'close')}</div>` : '';
}
function renderMessage(m) {
    const rx = state.reactions[m.id], saved = state.saved.includes(m.id), r = m.reply ? findMessage(m.reply) : null;
    return `<article class="message ${m.own ? 'own' : ''} ${selection ? 'selectable' : ''} ${selected.includes(m.id) ? 'selected' : ''}" id="msg-${esc(m.id)}" data-mid="${esc(m.id)}">${selection ? `<button class="select-message" data-action="select-message" data-id="${m.id}" aria-label="تحديد الرسالة">${selected.includes(m.id) ? icon('check') : ''}</button>` : ''}<div class="swipe-reply-indicator">${icon('reply')}</div><div class="bubble ${m.kind === 'sticker' ? 'sticker-bubble' : ''}">${m.forwarded ? `<div class="forwarded-label">${icon('forward')} محوّلة من ${esc(m.forwarded)}</div>` : ''}${r ? `<button class="quoted-message" data-action="jump" data-id="${r.id}"><strong>${r.own ? 'أنت' : esc(chatBy(r.chat)?.title)}</strong><span>${esc(messageText(r).slice(0, 90))}</span></button>` : ''}${messageBody(m)}<div class="message-meta">${saved ? '<span title="محفوظة">' + icon('save') + '</span>' : ''}${m.stamp ? new Date(m.stamp).toLocaleTimeString('ar', {
        hour: '2-digit',
        minute: '2-digit'
    }) : 'المادة الأصلية'}${m.own ? '<span class="local-check" title="محفوظة على هذا الجهاز">✓✓</span>' : ''}${btn('message-menu', 'خيارات الرسالة', 'more', m.id)}</div>${rx ? `<button class="reaction-chip" data-action="reaction" data-id="${m.id}" data-emoji="${esc(rx)}" aria-label="إزالة تفاعلك ${rx}"><span>${esc(rx)}</span> 1</button>` : ''}</div></article>`;
}
function messageBody(m) {
    if (m.kind === 'welcome') {
        const c = chatBy(m.chat), s = subjectBy(m.chat);
        return m.chat === 'meorslan' ? `<div class="official-welcome"><div class="welcome-orbit"><span>m</span>${verified()}</div><div class="eyebrow">أهلًا في muc</div><h1>دراستك أقرب.<br>رسالة، وفكرة، وفهم.</h1><p>موادك، أسئلتك وملاحظاتك.<br>كلها في مكان واحد يشبهك.</p><button data-action="materials" class="bubble-primary">افتح المواد ${icon('book')}</button></div>` : `<div class="subject-welcome"><span class="subject-label">${s?.full ? 'المقرر كاملًا' : 'من مادة موضوعات خاصة في الشبكات'}</span><h2>${esc(c.title)}</h2><p>${esc(c.desc)}</p><div class="subject-stats"><span>${s?.chapters.length || 0} مقطع شرح</span><span>${s?.exams.length || 0} امتحانات</span></div><button data-action="toc">${icon('list')} فهرس المادة</button><p class="keyword-tip"><span class="keyword-demo">Availability</span> اضغط على كلمة مميزة لتفهمها.</p></div>`;
    }
    if (m.kind === 'lesson') return lessonBody(m);
    if (m.kind === 'question') return questionBody(m);
    if (m.kind === 'paper') return `<div class="paper-message">${icon('file')}<h3>ورقة امتحان · ٤٠ علامة</h3><p>${esc(exams.find((e)=>e.id === m.ref)?.title || 'امتحان الشبكات')}</p><button class="bubble-primary" data-action="open-paper" data-id="${m.ref}">ابدأ الورقة</button></div>`;
    if (m.kind === 'sticker') return `<div class="animated-sticker" data-sticker="${esc(m.content)}">${esc(m.content)}</div>`;
    if (m.kind === 'attachment' && m.file) return `<div class="attachment"><div class="file-visual">${icon(m.file.type.startsWith('image/') ? 'image' : 'file')}</div><strong>${esc(m.file.name)}</strong>${m.file.type.startsWith('image/') ? `<button class="photo-open" data-action="view-file" data-id="${m.file.id}"><img data-file-image="${m.file.id}" alt="${esc(m.file.name)}"></button>` : m.file.type.startsWith('audio/') ? `<audio controls data-file-audio="${m.file.id}" aria-label="رسالة صوتية"></audio>` : ''}<button data-action="view-file" data-id="${m.file.id}">${icon('download')} فتح / تنزيل</button></div>`;
    return `<div class="message-text" dir="auto">${rich(m.content || '')}</div>`;
}
function keyword(text, key) {
    const escaped = esc(text);
    return `<button class="keyword" data-action="keyword" data-id="${esc(key)}" aria-label="اشرح ${escaped}"><span>${escaped}</span><svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="18" rx="48" ry="15"/></svg></button>`;
}
const TERM_FACTS = {
    Availability: 'foundations-10',
    Reliability: 'availability-1',
    Confidentiality: 'foundations-8',
    Integrity: 'foundations-9',
    MTTR: 'availability-9',
    MTBF: 'availability-8',
    MTTF: 'availability-7',
    OSPF: 'resilience-18',
    DNS: 'resilience-20',
    SPOF: 'foundations-25',
    SFP: 'availability-4',
    HA: 'ha-2',
    RUM: 'availability-56',
    SLA: 'availability-39',
    SLO: 'availability-21',
    SLI: 'availability-20',
    Resilience: 'resilience-1',
    Hypervisor: 'foundations-20',
    QoS: 'resilience-3',
    Failover: 'ha-10',
    Failback: 'ha-11',
    'N+1': 'ha-20',
    VLAN: 'architecture-15',
    DMZ: 'architecture-18'
};
function rich(text, limit = 4) {
    const names = [
        'Availability',
        'Reliability',
        'Confidentiality',
        'Integrity',
        'MTTR',
        'MTBF',
        'MTTF',
        'OSPF',
        'DNS',
        'SPOF',
        'SFP',
        'HA',
        'RUM',
        'SLA',
        'SLO',
        'SLI',
        'Resilience',
        'Hypervisor',
        'QoS',
        'Failover',
        'Failback',
        'N+1',
        'VLAN',
        'DMZ'
    ];
    let matches = [];
    for (const term of names){
        const reg = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
        let hit;
        while((hit = reg.exec(text)) && matches.length < 30){
            const fact = factMap.get(TERM_FACTS[term]);
            if (fact) matches.push({
                start: hit.index,
                end: hit.index + hit[0].length,
                text: hit[0],
                key: 'term:' + term
            });
        }
    }
    matches.sort((a, b)=>a.start - b.start);
    let out = '', pos = 0, count = 0;
    for (const x of matches){
        if (x.start < pos || count >= limit) continue;
        out += esc(text.slice(pos, x.start)) + keyword(x.text, x.key);
        pos = x.end;
        count++;
    }
    return (out + esc(text.slice(pos))).replace(/\n/g, '<br>');
}
function highlighted(q, text, part) {
    const p = part === undefined ? D.clues[q.factId] || D.caseCues[q.id]?.prompt : D.caseCues[q.id]?.parts[part]?.prompt;
    if (!p) return rich(text);
    const i = text.toLowerCase().indexOf(p.toLowerCase());
    if (i < 0) return rich(text);
    return esc(text.slice(0, i)) + keyword(text.slice(i, i + p.length), q.factId || 'q:' + q.id + (part === undefined ? '' : ':' + part)) + esc(text.slice(i + p.length));
}
function lessonBody(m) {
    const c = chapterMap.get(m.ref);
    if (!c) return '<p>المقطع غير متاح.</p>';
    return `<div class="lesson-message"><div class="lesson-kicker">${icon('book')} من المحاضرة · صفحات ${c.pages.join('، ')}</div><h2>${esc(c.title)}</h2><div class="level-switch"><button data-action="level" data-id="beginner" aria-pressed="${state.level === 'beginner'}">شرح مبسط</button><button data-action="level" data-id="university" aria-pressed="${state.level === 'university'}">طالب جامعي</button></div><p class="lesson-intro">${rich(c[state.level] || c.beginner)}</p><ol class="lesson-points">${c.points.map((p)=>`<li>${rich(p)}</li>`).join('')}</ol><div class="source-links">${c.pages.map((p)=>`<a href="${encodeURIComponent(c.source)}#page=${p}" target="_blank" rel="noopener">${icon('file')} صفحة ${p}</a>`).join('')}</div><button class="inline-study-button" data-action="practice-section" data-id="${c.id}">جرّب سؤالًا من هالمقطع ${icon('chat')}</button></div>`;
}
function correct(q, value) {
    if (!q) return false;
    if (q.type === 'mcq') return Number(value) === q.correct;
    if (q.type === 'tf') return String(value) === String(q.correct);
    const norm = (v)=>String(v ?? '').normalize('NFKC').trim().toLowerCase().replace(/[%،,]/g, '').replace(/[٠-٩]/g, (c)=>String(c.charCodeAt(0) - 1632));
    const a = norm(value), b = norm(q.answer);
    return a === b || a !== '' && !isNaN(Number(a)) && !isNaN(Number(b)) && Math.abs(Number(a) - Number(b)) <= .005;
}
function questionBody(m) {
    const q = qMap.get(m.ref);
    if (!q) return '';
    const value = state.quiz[m.id], answered = value !== undefined && value !== '', show = state.revealed[m.id] ?? answered;
    let controls = '';
    if (q.type === 'mcq') controls = `<div class="quiz-options">${q.options.map((o, i)=>`<button data-action="choose" data-id="${m.id}" data-value="${i}" class="${answered ? i === q.correct ? 'correct' : Number(value) === i ? 'wrong' : '' : ''}"><span class="radio-indicator">${answered && i === q.correct ? icon('check') : String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
    if (q.type === 'tf') controls = `<div class="tf-choices">${[
        true,
        false
    ].map((v)=>`<button data-action="choose" data-id="${m.id}" data-value="${v}" class="${answered ? v === q.correct ? 'correct' : String(value) === String(v) ? 'wrong' : '' : ''}">${v ? 'True' : 'False'}</button>`).join('')}</div>`;
    if (q.type === 'blank') controls = `<form class="blank-form" data-mid="${m.id}"><input class="blank-answer" data-mid="${m.id}" aria-label="إجابة الفراغ" placeholder="Type your answer…" dir="ltr" value="${esc(value ?? '')}"><button type="submit">تحقق ${icon('check')}</button></form>`;
    return `<div class="quiz-message"><div class="quiz-label">${q.type === 'case' ? 'حالة دراسية · ٥ علامات' : q.type === 'mcq' ? 'اختيار من متعدد' : q.type === 'tf' ? 'صح أو خطأ' : 'أكمل الفراغ'}${q.calc ? '<span>حساب</span>' : ''}</div><h3 class="question-en" dir="ltr" lang="en">${highlighted(q, q.en.replace('____', '________'))}</h3><details class="translation"><summary>ترجمة السؤال</summary><p>${esc(q.ar)}</p></details>${q.type === 'case' ? q.parts.map((p, j)=>`<div class="case-part"><h4 dir="ltr">${String.fromCharCode(97 + j)}. ${highlighted(q, p.en, j)} <small>[${p.marks}]</small></h4><details class="translation"><summary>ترجمة الجزء</summary><p>${esc(p.ar)}</p></details><textarea class="case-draft" data-mid="${m.id}" data-part="${j}" dir="auto" aria-label="إجابتك عن الجزء ${j + 1}" placeholder="اكتب إجابتك…">${esc(state.caseDrafts[m.id + ':' + j] || '')}</textarea>${show ? `<div class="case-model"><strong>الإجابة النموذجية</strong><p dir="ltr">${markAnswer(p.model, D.caseCues[q.id]?.parts[j]?.answer)}</p>${mathFor(q, j)}<p>${rich(p.why)}</p><label class="self-grade">تقييمك الذاتي من ${p.marks}<input type="number" min="0" max="${p.marks}" step="0.5" data-grade="${m.id}:${j}" value="${esc(state.grades[m.id + ':' + j] ?? '')}" aria-label="علامة الجزء ${j + 1}"></label></div>` : ''}</div>`).join('') : controls}${show && q.type !== 'case' ? `<div class="quiz-feedback ${answered ? correct(q, value) ? 'is-correct' : 'is-wrong' : ''}"><strong>${answered ? correct(q, value) ? 'إجابة صحيحة، ممتاز ✓' : 'خلينا نراجعها سوا' : 'الإجابة والشرح'}</strong><p dir="ltr">${markAnswer(q.type === 'tf' ? q.correct ? 'True' : 'False' : q.answer)}</p>${q.type === 'tf' && !q.correct ? `<p dir="ltr">${rich(q.statement)}</p>` : ''}${mathFor(q)}<p>${rich(q.why)}</p></div>` : ''}<div class="quiz-tools"><button data-action="reveal" data-id="${m.id}">${show ? 'إخفاء الشرح' : 'افتح الحل والشرح'}</button>${answered ? `<button data-action="retry" data-id="${m.id}">حاول مجددًا</button>` : ''}<button data-action="open-paper" data-id="${q.exam.id}">الورقة الكاملة ${icon('file')}</button></div>${show ? sourceRef(q) : ''}</div>`;
}
function markAnswer(text, term) {
    if (!term) return `<mark class="answer-mark">${esc(text)}</mark>`;
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    return i < 0 ? esc(text) : esc(text.slice(0, i)) + `<mark class="answer-mark">${esc(text.slice(i, i + term.length))}</mark>` + esc(text.slice(i + term.length));
}
function sourceRef(q) {
    return `<div class="source-links">${q.pages.map((p)=>`<a href="${encodeURIComponent(q.source)}#page=${p}" target="_blank" rel="noopener">${icon('file')} المصدر · ${p}</a>`).join('')}</div>`;
}
function mathFor(q, part) {
    const keys = part === undefined ? D.guides[q.factId] ? [
        q.factId
    ] : [] : D.cases[q.id + ':' + part] || [];
    return keys.map((k)=>{
        const g = D.guides[k];
        return `<section class="worked-solution"><div class="formula-box"><strong>القانون المستخدم</strong><div dir="ltr">${esc(g.formula)}</div></div><p class="formula-symbols">${esc(g.symbols)}</p><h4>المعطيات · من وين إجت الأرقام؟</h4><ul>${g.givens.map((t)=>`<li>${esc(t)}</li>`).join('')}</ul><h4>التعويض خطوة بخطوة</h4><ol>${g.steps.map((s)=>`<li><strong>${esc(s.title)}</strong><div class="math-expression" dir="ltr">${esc(s.math)}</div><p>${esc(s.note)}</p></li>`).join('')}</ol><div class="math-result">النتيجة <bdi>${markAnswer(g.result)}</bdi></div><p>${esc(g.meaning)}</p></section>`;
    }).join('');
}
function reviewView() {
    const answers = Object.entries(state.quiz), correctCount = answers.filter(([mid, v])=>{
        const m = findMessage(mid);
        const q = m ? qMap.get(m.ref) : null;
        return q && correct(q, v);
    }).length;
    return `<section class="page-view"><header><span class="eyebrow">خطوة صغيرة، كل يوم</span><h1>مساحة المراجعة</h1><p>فهمك أولًا. اختبره، وارجع للنقاط اللي تحتاجها.</p></header><div class="review-stats"><div><strong>${answers.length}</strong><span>إجابات في المحادثات</span></div><div><strong>${correctCount}</strong><span>إجابة صحيحة</span></div><div><strong>${state.starred.length}</strong><span>كلمات محفوظة</span></div></div><div class="review-shortcuts"><button data-action="wrong-review">${icon('reply')} راجع أخطاءك</button><button data-action="starred">${icon('star')} كلماتي</button><button data-action="papers">${icon('file')} الامتحانات الـ٤٢</button><button data-action="source-library">${icon('book')} المحاضرات الأصلية</button></div><h2>تابع مادة</h2><div class="review-subjects">${subjects.filter((s)=>!s.full).map((s)=>`<button data-action="chat" data-id="${s.id}">${avatar(s)}<span><strong>${s.title}</strong><small>${s.chapters.length} مقطعًا · ${s.exams.length} أوراق</small></span>${icon('chevron')}</button>`).join('')}</div><p class="page-note">نفس محتوى المحاضرات الأصلية ونفس توزيع الورقة: ١٥ اختيار، ٥ صح وخطأ، ١٠ فراغات، و١٠ علامات حالات. التقييم الكتابي ذاتي باستخدام النموذج.</p></section>`;
}
function settingsView() {
    const p = state.preferences;
    return `<section class="page-view settings-page"><header><span class="eyebrow">على مزاجك</span><h1>الإعدادات</h1><p>مساحة مريحة، بالطريقة اللي بتناسبك.</p></header><div class="profile-card">${avatar({
        id: 'meorslan',
        official: true
    })}<span><strong>meorslan ${verified()}</strong><small>حساب المنصة المعتمد داخل muc</small></span></div><h2>المظهر</h2><div class="theme-grid">${[
        [
            'light',
            'فاتح',
            'sun'
        ],
        [
            'dark',
            'داكن',
            'moon'
        ],
        [
            'auto',
            'حسب الجهاز',
            'settings'
        ]
    ].map(([v, l, i])=>`<button data-action="appearance" data-id="${v}" aria-pressed="${p.theme === v}"><span class="theme-swatch ${v}">${icon(i)}</span>${l}${p.theme === v ? icon('check') : ''}</button>`).join('')}</div><div class="setting-group"><label class="setting-row">حجم النص <span><input type="range" min="15" max="21" value="${p.font}" id="font-range" aria-label="حجم النص"><b id="font-label">${p.font}</b></span></label><label class="setting-row">الحركات والتأثيرات <input type="checkbox" id="motion-setting" ${p.motion ? 'checked' : ''} role="switch"></label><label class="setting-row">صوت خفيف عند الإرسال <input type="checkbox" id="sound-setting" ${p.sounds ? 'checked' : ''} role="switch"></label></div><h2>خلفية المحادثة</h2><div class="wallpaper-grid">${[
        [
            'doodles',
            'رسومات'
        ],
        [
            'night',
            'هادئة'
        ],
        [
            'blue',
            'أزرق'
        ]
    ].map(([v, l])=>`<button class="wallpaper-preview ${v}" data-action="wallpaper" data-id="${v}" aria-pressed="${p.wallpaper === v}">${p.wallpaper === v ? icon('check') : ''}<span>${l}</span></button>`).join('')}</div><h2>محتواك وتقدمك</h2><div class="setting-group"><button class="setting-row" data-action="export">${icon('download')} تصدير نسخة من تقدمك ${icon('chevron')}</button><button class="setting-row" data-action="import">${icon('file')} استيراد نسخة محفوظة ${icon('chevron')}</button><button class="setting-row" data-action="offline">${icon('download')} تنزيل محتوى الدراسة للمراجعة دون إنترنت ${icon('chevron')}</button><button class="setting-row" data-action="install">${icon('plus')} إضافة muc للشاشة الرئيسية ${icon('chevron')}</button><button class="setting-row" data-action="help">${icon('chat')} دليل التفاعلات ${icon('chevron')}</button></div><p class="page-note">رسائلك وتفاعلاتك وتقدمك على هذا الجهاز. ملفاتك المرفقة تبقى في المتصفح؛ نسخة التقدم المصدّرة تشمل النصوص والإجابات، والملفات تحتاج حفظًا منفصلًا.</p><div class="about-muc"><span class="brand">muc<span class="brand-dot"></span></span><p>موادك الدراسية في محادثات.</p><small>محتوى الشبكات الأصلي · إصدار ١</small></div></section>`;
}
function rememberScroll() {
    const feed = document.querySelector('#message-feed');
    if (feed && active) scrollPositions[active] = feed.scrollTop;
}
function refresh(bottom = false) {
    rememberScroll();
    if (bottom && active) scrollPositions[active] = Number.MAX_SAFE_INTEGER;
    render();
}
function closeOverlay() {
    if (overlayCleanup) {
        overlayCleanup();
        overlayCleanup = null;
    }
    overlays.innerHTML = '';
    document.body.classList.remove('overlay-open');
}
function sheet(title, body, cls = '') {
    closeOverlay();
    overlays.innerHTML = `<div class="sheet-backdrop" data-action="close-overlay"></div><section class="sheet ${cls}" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle"></div><header><h2 id="sheet-title" tabindex="-1">${title}</h2>${btn('close-overlay', 'إغلاق', 'close')}</header><div class="sheet-content">${body}</div></section>`;
    document.body.classList.add('overlay-open');
    document.querySelector('#sheet-title')?.focus();
}
function openKeyword(key) {
    const term = key.startsWith('term:') ? key.slice(5) : '';
    let f = factMap.get(term ? TERM_FACTS[term] : key), q = null, part = null;
    if (key.startsWith('q:')) {
        let raw = key.slice(2), num = raw.lastIndexOf(':');
        q = qMap.get(num >= 0 ? raw.slice(0, num) : raw);
        part = num >= 0 ? Number(raw.slice(num + 1)) : undefined;
        f = q;
    }
    if (!f) return;
    const g = !term || [
        'MTTR',
        'MTBF',
        'MTTF',
        'N+1'
    ].includes(term) ? D.guides[f.factId || f.id] : null, clue = term || D.clues[f.factId || f.id] || D.caseCues[f.id]?.parts[part]?.prompt || D.caseCues[f.id]?.prompt || f.en;
    const answer = term || (part !== undefined && q ? q.parts[part].model : f.answer || f.title || 'الفكرة المطلوبة');
    sheet('الكلمة اللي بتوصلك للفكرة', `<div class="keyword-learning"><span class="small-label">من نص السؤال</span><div class="keyword-origin">${esc(clue)}</div><div class="keyword-connection"><svg viewBox="0 0 260 70" aria-hidden="true"><path d="M20 10C80 65 190-15 240 58"/><circle cx="240" cy="58" r="5"/></svg><span>اربطها بـ${g ? 'القانون' : 'الفكرة'}</span></div><div class="keyword-target" dir="auto">${esc(g ? g.formula : answer)}</div><p>${esc(part !== undefined && q ? q.parts[part].why : f.why || 'راجع الشرح المرتبط بالسؤال من صفحات المحاضرة.')}</p>${g ? `<p class="keyword-note">احفظ ارتباط الكلمة بالقانون. الناتج بيتغير لما الأرقام تتغير.</p>` : ''}<div class="sheet-actions"><button class="primary" data-action="keyword-practice" data-id="${esc(key)}">جرّب سؤالًا</button><button data-action="star-word" data-id="${esc(key)}">${icon('star')} ${state.starred.includes(key) ? 'إزالة من كلماتي' : 'احفظ الكلمة'}</button></div>${sourceRef(f)}</div>`, 'keyword-sheet');
    burst('💡');
}
function toc(cid = active) {
    const s = subjectBy(cid);
    if (!s) {
        materials();
        return;
    }
    sheet('فهرس ' + esc(s.title), `<div class="toc-tabs"><button data-action="papers" data-id="${s.id}">${icon('file')} الامتحانات</button><button data-action="source-library">${icon('file')} الملفات الأصلية</button></div><p class="sheet-intro">نفس المحاور ونفس الأمثلة من الملفات الأصلية. اختَر مقطعًا ليصلك كرسالة.</p><div class="toc-list">${s.chapters.map((cid, i)=>{
        const c = chapterMap.get(cid);
        return `<button data-action="send-lesson" data-id="${cid}" data-chat="${s.id}"><span class="toc-count">${i + 1}</span><span><strong>${esc(c.title)}</strong><small>صفحات ${c.pages.join('، ')}</small></span>${icon('chevron')}</button>`;
    }).join('')}</div>`);
}
function materials() {
    sheet('المواد ووحدات المقرر', `<p class="sheet-intro">المحتوى المتوفر من مادة «موضوعات خاصة في شبكات الحاسوب». الوحدات أدناه من نفس محاضرات المقرر.</p><div class="material-picker">${subjects.map((s)=>`<button data-action="chat" data-id="${s.id}">${avatar(s)}<span><strong>${s.title}</strong><small>${s.desc}</small></span>${icon('chevron')}</button>`).join('')}</div>`);
}
function sourceLibrary() {
    sheet('المحاضرات الأصلية', `<p class="sheet-intro">نسخ من ملفات مادة الشبكات الأصلية، مع حفظ ترقيم صفحات PDF.</p><div class="source-library">${C.documents.map((d)=>`<a href="${encodeURIComponent(d.source)}" target="_blank" rel="noopener">${icon('file')}<span><strong>${esc(d.title)}</strong><small>${d.pageCount} صفحة · PDF</small></span>${icon('download')}</a>`).join('')}</div>`);
}
function papers(cid = '') {
    const s = subjectBy(cid) || subjectBy(active);
    let list = s ? exams.filter((e)=>s.exams.includes(e.id)) : exams;
    sheet('أوراق الامتحانات', `<p class="sheet-intro">٤٠ علامة · ١٥ اختيار + ٥ صح وخطأ + ١٠ فراغات + ١٠ حالات. جميع النماذج والشروح من النسخة الأصلية.</p><label class="paper-filter">الأسبوع<select id="paper-week"><option value="all">كل الأسابيع</option>${[
        1,
        2,
        3,
        4,
        5
    ].map((w)=>`<option value="${w}">الأسبوع ${w}</option>`).join('')}</select></label><div id="paper-list" class="paper-list">${paperList(list)}</div>`);
    document.querySelector('#paper-week').onchange = (e)=>{
        const v = e.target.value;
        document.querySelector('#paper-list').innerHTML = paperList(list.filter((e)=>v === 'all' || e.week === v));
    };
}
function paperList(list) {
    return list.map((e)=>`<button data-action="open-paper" data-id="${e.id}"><span class="paper-icon">${icon('file')}</span><span><strong>${esc(e.title)}</strong><small>الأسبوع ${e.week} · النموذج ${e.form} · ٤٠ علامة</small></span><span class="paper-open">ابدأ</span></button>`).join('') || '<p class="empty-state">لا يوجد نموذج لهذا الأسبوع ضمن هذه الوحدة.</p>';
}
function openPaper(eid) {
    const e = exams.find((e)=>e.id === eid);
    if (!e) return;
    closeOverlay();
    overlays.innerHTML = `<section class="paper-viewer" role="dialog" aria-modal="true" aria-label="ورقة الامتحان"><header>${btn('close-overlay', 'إغلاق ورقة الامتحان', 'back')}<strong>الأسبوع ${e.week} · النموذج ${e.form}</strong><a href="paper-index.html#exam/${eid}" target="_blank" rel="noopener">فتح مستقل</a></header><iframe src="paper-index.html#exam/${eid}" title="${esc(e.title)} — النموذج ${e.form}" sandbox="allow-scripts allow-same-origin allow-modals allow-downloads allow-popups"></iframe></section>`;
    document.body.classList.add('overlay-open');
}
function profile(cid = active) {
    const c = chatBy(cid), s = subjectBy(cid);
    sheet(esc(c.title) + (c.official ? verified() : ''), `<div class="profile-top">${avatar(c)}<h3>${esc(c.title)} ${c.official ? verified() : ''}</h3><p>${c.official ? 'حساب المنصة المعتمد داخل muc. دليل الاستخدام ومحتوى الدراسة؛ ليس حسابًا متصلًا بخدمة Telegram.' : esc(c.desc || 'محادثة شخصية على هذا الجهاز.')}</p></div>${s ? `<div class="profile-details"><p>من مادة موضوعات خاصة في شبكات الحاسوب.</p><p>${s.chapters.length} مقطعًا · ${s.exams.length} أوراق امتحان</p><button data-action="toc" data-id="${s.id}">${icon('list')} فهرس المادة</button><button data-action="papers" data-id="${s.id}">${icon('file')} الامتحانات</button><button data-action="source-library">${icon('file')} ملفات المحاضرات</button></div>` : ''}<div class="setting-group"><button class="setting-row" data-action="chat-attachments" data-id="${cid}">${icon('attach')} المرفقات والوسائط</button><button class="setting-row" data-action="chat-pins" data-id="${cid}">${icon('pin')} الرسائل المثبتة</button><button class="setting-row" data-action="chat-mute" data-id="${cid}">${icon('mute')} ${state.muted.includes(cid) ? 'تشغيل التنبيه داخل المنصة' : 'إسكات المحادثة'}</button></div>`);
}
function chatMenu(cid) {
    const c = chatBy(cid);
    sheet('خيارات ' + esc(c.title), `<div class="action-list"><button data-action="profile" data-id="${cid}">${icon('chat')} معلومات المحادثة</button><button data-action="chat-pin" data-id="${cid}">${icon('pin')} ${state.pins['chat:' + cid] ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة'}</button><button data-action="chat-unread" data-id="${cid}">${icon('chat')} تعيين كغير مقروءة</button><button data-action="chat-archive" data-id="${cid}">${icon('archive')} ${state.archived.includes(cid) ? 'إرجاع من الأرشيف' : 'نقل للأرشيف'}</button><button data-action="chat-mute" data-id="${cid}">${icon('mute')} ${state.muted.includes(cid) ? 'إلغاء الإسكات' : 'إسكات المحادثة'}</button><button data-action="chat-attachments" data-id="${cid}">${icon('attach')} الوسائط والمرفقات</button>${subjectBy(cid) ? `<button data-action="toc" data-id="${cid}">${icon('book')} فهرس المحاضرات</button>` : ''}</div>`);
}
function contextMenu(mid) {
    const m = findMessage(mid);
    if (!m) return;
    closeOverlay();
    const pinned = (state.pins[active] || []).includes(mid);
    overlays.innerHTML = `<div class="context-backdrop" data-action="close-overlay"></div><section class="message-context" role="dialog" aria-modal="true" aria-label="خيارات الرسالة"><div class="context-reactions">${[
        '👍',
        '❤️',
        '🔥',
        '💡',
        '🎉',
        '🤔',
        '🔁'
    ].map((e)=>`<button data-action="reaction" data-id="${mid}" data-emoji="${e}" aria-label="تفاعل ${e}" class="${state.reactions[mid] === e ? 'active' : ''}">${e}</button>`).join('')}<button data-action="all-reactions" data-id="${mid}" aria-label="كل التفاعلات">${icon('plus')}</button></div><div class="context-preview">${esc(messageText(m).slice(0, 220))}</div><div class="context-actions">${[
        [
            'reply',
            'رد',
            'reply'
        ],
        [
            'save',
            state.saved.includes(mid) ? 'إزالة من المحفوظات' : 'حفظ الرسالة',
            'save'
        ],
        [
            'copy',
            'نسخ النص',
            'copy'
        ],
        [
            'forward',
            'تحويل',
            'forward'
        ],
        [
            'pin',
            pinned ? 'إلغاء التثبيت' : 'تثبيت الرسالة',
            'pin'
        ],
        [
            'select',
            'تحديد',
            'check'
        ],
        ...m.own && m.kind === 'text' ? [
            [
                'edit-message',
                'تعديل',
                'edit'
            ]
        ] : [],
        [
            'delete-message',
            'إخفاء من محادثتي',
            'trash'
        ]
    ].map(([a, l, i])=>`<button data-action="${a}" data-id="${mid}">${icon(i)}<span>${l}</span></button>`).join('')}</div></section>`;
    document.body.classList.add('overlay-open');
    haptic();
}
function reaction(mid, emoji) {
    const m = findMessage(mid);
    state.reactions[mid] = state.reactions[mid] === emoji ? null : emoji;
    persist();
    closeOverlay();
    refresh();
    if (state.reactions[mid]) burst(emoji);
    if (m && !state.saved.includes(mid) && emoji === '🔁') toast('ضفتها للمراجعة. بتلاقيها تحت «راجع أخطاءك».');
}
function burst(emoji) {
    if (!state.preferences.motion) return;
    const b = document.createElement('div');
    b.className = 'reaction-burst';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = Array.from({
        length: 7
    }, (_, i)=>`<span style="--i:${i}">${emoji}</span>`).join('');
    document.body.append(b);
    setTimeout(()=>b.remove(), 1100);
}
function haptic() {
    if (state.preferences.motion) navigator.vibrate?.(12);
}
function help() {
    sheet('كل تفاعل إله معنى', `<div class="help-list">${[
        [
            '💛',
            'الكلمات المضيئة',
            'اضغط الكلمة لتشوف شرحها وعلاقتها بالفكرة أو القانون، واحفظها في «كلماتي».'
        ],
        [
            '👆',
            'ضغط مطوّل',
            'افتح التفاعلات، الحفظ، التثبيت، النسخ، التحويل والتحديد. على الكمبيوتر استخدم زر خيارات الرسالة أو زر الفأرة الأيمن.'
        ],
        [
            '↩',
            'اسحب للرد',
            'اسحب رسالة لليسار لاقتباسها والرد عليها. الضغط مرتين يضيف قلبًا.'
        ],
        [
            '🔁',
            'راجعها لاحقًا',
            'تفاعل 🔁 يضيف الرسالة إلى قائمة المراجعة، و💡 يعني إن الفكرة وضحت لك.'
        ],
        [
            '📝',
            'الامتحان الجامعي',
            'افتح الورقة الكاملة من المحادثة: تصحيح موضوعي، سلم حالات ذاتي، وطباعة ورقة فارغة.'
        ],
        [
            '📎',
            'ملاحظاتك وملفاتك',
            'أرسل ملاحظة أو صورة أو PDF أو تسجيلًا صوتيًا. التسجيل يتطلب سماح الميكروفون، ويمكن إلغاؤه.'
        ],
        [
            '🔒',
            'مساحتك الشخصية',
            'المحادثات هنا لتنظيم دراستك. رسائلك وردود الدراسة وتقدمك محفوظة على جهازك؛ لا تُرسل إلى طلاب آخرين.'
        ]
    ].map(([e, t, p])=>`<article><span>${e}</span><div><h3>${t}</h3><p>${p}</p></div></article>`).join('')}</div>`);
}
function forwardPicker(mids) {
    sheet('تحويل إلى محادثة', `<p class="sheet-intro">${mids.length} رسالة · ستظهر كرسائل محوّلة في المحادثة التي تختارها.</p><div class="material-picker">${allChats().map((c)=>`<button data-action="forward-to" data-id="${c.id}" data-mids="${esc(JSON.stringify(mids))}">${avatar(c)}<span><strong>${esc(c.title)}</strong></span>${icon('forward')}</button>`).join('')}</div>`);
}
function setReply(mid) {
    replyTo = mid;
    editId = '';
    closeOverlay();
    const el = document.querySelector('#reply-preview');
    if (el) el.innerHTML = replyBar();
    document.querySelector('#composer-input')?.focus();
}
function sendText() {
    const input = document.querySelector('#composer-input');
    if (!input || !active) return;
    const text = input.value.trim();
    if (!text) return;
    if (editId) {
        const m = findMessage(editId);
        if (m && m.own) {
            m.content = text;
            persist();
        }
        editId = '';
        state.drafts[active] = '';
        refresh();
        return;
    }
    const cid = active, r = replyTo;
    add(cid, {
        kind: 'text',
        content: text,
        own: true,
        reply: r || undefined
    });
    state.drafts[cid] = '';
    replyTo = '';
    persist();
    refresh(true);
    playSend();
    if (cid === 'saved' || state.custom.some((c)=>c.id === cid)) return;
    const target = r ? findMessage(r) : null;
    if (target?.kind === 'question') {
        const q = qMap.get(target.ref);
        if (q.type === 'case') {
            state.revealed[target.id] = true;
            add(cid, {
                content: 'إجابتك محفوظة. افتح النموذج وقارنها بالنقاط المطلوبة؛ تقييم الحالات ذاتي باستخدام سلم العلامات.'
            });
            persist();
            refresh(true);
            return;
        }
        let v = text;
        if (q.type === 'mcq') {
            const i = [
                'a',
                'b',
                'c',
                'd'
            ].indexOf(text.toLowerCase());
            v = i >= 0 ? i : q.options.findIndex((o)=>o.toLowerCase() === text.toLowerCase());
            if (v < 0) {
                add(cid, {
                    content: 'اختَر أحد الأزرار تحت السؤال، أو رد بحرف الخيار A / B / C / D.'
                });
                refresh(true);
                return;
            }
        }
        if (q.type === 'tf') v = /^(true|صح|صحيح)$/i.test(text) ? 'true' : /^(false|خطأ|خطا)$/i.test(text) ? 'false' : text;
        state.quiz[target.id] = v;
        persist();
        refresh(true);
        return;
    }
    busy = cid;
    refresh(true);
    setTimeout(()=>{
        busy = '';
        const normalized = text.toLowerCase();
        if (/امتحان|exam/.test(normalized)) {
            const sub = subjectBy(cid) || subjects[0];
            add(cid, {
                kind: 'paper',
                ref: sub.exams[0]
            });
        } else if (/حالة|case/.test(normalized)) sendQuestion(cid, true, false);
        else if (/سؤال|question/.test(normalized)) sendQuestion(cid, false, false);
        else if (/درس|شرح|lecture/.test(normalized)) sendLesson(cid, undefined, false);
        else if (/ملفات|محاضرات|sources/.test(normalized)) add(cid, {
            content: 'افتح أيقونة الفهرس المثبّتة أعلى المحادثة، أو معلومات المادة ثم «ملفات المحاضرات» للوصول إلى المصدر الأصلي.'
        });
        else {
            const term = facts.find((f)=>normalized === f.answer.toLowerCase() || f.answer.length > 3 && normalized.includes(f.answer.toLowerCase()));
            if (term) add(cid, {
                content: term.answer + '\n' + term.why
            });
            else add(cid, {
                content: cid === 'meorslan' ? 'أهلًا فيك 👋 اختَر «المواد» لتبدأ. اكتب: درس، سؤال، حالة، أو امتحان، أو اسم مصطلح مثل MTTR.' : 'ملاحظتك محفوظة. للدراسة اكتب: درس، سؤال، حالة أو امتحان، أو اضغط أحد أزرار المحادثة. الشرح المتاح مبني على المادة الأصلية.'
            });
        }
        persist();
        if (active === cid) refresh(true);
    }, 650);
}
function sendLesson(cid, cidRef, update = true) {
    const s = subjectBy(cid) || subjects[0];
    let cursor = state.cursor[cid + ':lesson'] || 1;
    const ref = cidRef || s.chapters[cursor % s.chapters.length];
    if (!cidRef) state.cursor[cid + ':lesson'] = cursor + 1;
    add(cid, {
        kind: 'lesson',
        ref
    });
    persist();
    if (update) refresh(true);
}
function sendQuestion(cid, isCase = false, update = true, qid) {
    const s = subjectBy(cid) || subjects[0], key = cid + (isCase ? ':case' : ':question'), list = questions.filter((q)=>s.exams.includes(q.exam.id) && (isCase ? q.type === 'case' : q.type !== 'case')), seen = new Set(messages(cid).filter((m)=>m.kind === 'question').map((m)=>m.ref));
    const q = qid ? qMap.get(qid) : list.find((q)=>!seen.has(q.id)) || list[(state.cursor[key] || 0) % list.length];
    if (!q) return;
    state.cursor[key] = (state.cursor[key] || 0) + 1;
    add(cid, {
        kind: 'question',
        ref: q.id
    });
    persist();
    if (update) refresh(true);
}
function showEmoji(stickers = false) {
    const emojis = stickers ? [
        '🧠',
        '💡',
        '🎉',
        '🔥',
        '👏',
        '☕',
        '📚',
        '💪',
        '🚀',
        '🥳',
        '🎯',
        '✨'
    ] : [
        '😀',
        '😁',
        '😊',
        '😍',
        '🥰',
        '😎',
        '🤔',
        '🧐',
        '😅',
        '😴',
        '🤯',
        '🥳',
        '👍',
        '👏',
        '🙌',
        '💪',
        '❤️',
        '💙',
        '💡',
        '🔥',
        '🎉',
        '✨',
        '📚',
        '📝',
        '✅',
        '🔁',
        '🎯',
        '🚀'
    ];
    sheet(stickers ? 'ملصقات متحركة' : 'إيموجي', `<div class="picker-tabs"><button data-action="emoji">إيموجي</button><button data-action="stickers">ملصقات متحركة</button></div><div class="emoji-grid ${stickers ? 'stickers-grid' : ''}">${emojis.map((e)=>`<button data-action="${stickers ? 'send-sticker' : 'insert-emoji'}" data-id="${e}" aria-label="${e}"><span>${e}</span></button>`).join('')}</div>`);
}
function playSend() {
    if (!state.preferences.sounds) return;
    try {
        const ctx = new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(540, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + .06);
        g.gain.setValueAtTime(.035, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .11);
        o.start();
        o.stop(ctx.currentTime + .12);
        o.onended = ()=>ctx.close();
    } catch  {}
}
async function database() {
    return await new Promise((resolve, reject)=>{
        const r = indexedDB.open('muc-files-v1', 1);
        r.onupgradeneeded = ()=>r.result.createObjectStore('files', {
                keyPath: 'id'
            });
        r.onsuccess = ()=>resolve(r.result);
        r.onerror = ()=>reject(r.error);
    });
}
async function putFile(blob, name) {
    const db = await database(), fid = id();
    await new Promise((resolve, reject)=>{
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put({
            id: fid,
            blob,
            name,
            type: blob.type
        });
        tx.oncomplete = ()=>resolve();
        tx.onerror = ()=>reject(tx.error);
    });
    db.close();
    attachments[fid] = URL.createObjectURL(blob);
    return {
        id: fid,
        name,
        type: blob.type
    };
}
async function getFile(fid) {
    const db = await database();
    return await new Promise((resolve, reject)=>{
        const r = db.transaction('files').objectStore('files').get(fid);
        r.onsuccess = ()=>{
            resolve(r.result);
            db.close();
        };
        r.onerror = ()=>reject(r.error);
    });
}
async function hydrateFiles() {
    for (const el of document.querySelectorAll('[data-file-image],[data-file-audio]')){
        const fid = el.dataset.fileImage || el.dataset.fileAudio;
        try {
            if (!attachments[fid]) {
                const f = await getFile(fid);
                if (f) attachments[fid] = URL.createObjectURL(f.blob);
            }
            if (attachments[fid]) el.src = attachments[fid];
        } catch  {}
    }
}
function attachmentPicker() {
    if (!active) {
        toast('افتح محادثة أولًا.');
        return;
    }
    sheet('إرفاق بمحادثتك', `<p class="sheet-intro">ملفاتك تبقى محفوظة على هذا الجهاز داخل muc.</p><div class="attachment-picker"><button data-action="pick-image">${icon('image')} صورة</button><button data-action="pick-document">${icon('file')} ملف / PDF</button><button data-action="voice">${icon('mic')} تسجيل صوتي</button></div>`);
}
function chooseFile(images = false) {
    closeOverlay();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = images ? 'image/*' : '.pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.ogg,.wav';
    input.multiple = true;
    input.onchange = async ()=>{
        for (const file of Array.from(input.files || [])){
            if (file.size > 25 * 1024 * 1024) {
                toast('الحد للملف الواحد ٢٥ MB.');
                continue;
            }
            try {
                const data = await putFile(file, file.name);
                add(active, {
                    kind: 'attachment',
                    file: data,
                    own: true
                });
                refresh(true);
            } catch  {
                toast('تعذّر حفظ الملف على هذا الجهاز. جرّب ملفًا أصغر.');
            }
        }
    };
    input.click();
}
async function viewFile(fid) {
    try {
        const f = await getFile(fid);
        if (!f) {
            toast('الملف غير موجود على هذا الجهاز.');
            return;
        }
        const url = attachments[fid] || (attachments[fid] = URL.createObjectURL(f.blob));
        sheet(esc(f.name), `${f.type.startsWith('image/') ? `<img class="media-preview" src="${url}" alt="${esc(f.name)}">` : f.type.startsWith('audio/') ? `<audio class="media-audio" controls src="${url}"></audio>` : f.type === 'application/pdf' ? `<iframe class="pdf-preview" src="${url}" title="${esc(f.name)}"></iframe>` : '<p>ملف محفوظ على جهازك. يمكنك تنزيله وفتحه بالبرنامج المناسب.</p>'}<a class="primary download-file" href="${url}" download="${esc(f.name)}">${icon('download')} تنزيل الملف</a>`);
    } catch  {
        toast('تعذّر فتح الملف المحفوظ.');
    }
}
async function voice(cancel = false) {
    if (recording) {
        if (cancel && mediaRecorder) mediaRecorder.cancelled = true;
        mediaRecorder?.stop();
        return;
    }
    if (cancel) return;
    if (!active) {
        toast('افتح محادثة لتسجيل ملاحظة صوتية.');
        return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        toast('التسجيل غير مدعوم هنا. تقدر ترفق ملفًا صوتيًا من جهازك.');
        return;
    }
    closeOverlay();
    try {
        const cid = active;
        recordStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        mediaRecorder = new MediaRecorder(recordStream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e)=>{
            if (e.data.size) chunks.push(e.data);
        };
        mediaRecorder.onstop = async ()=>{
            clearInterval(recordTimer);
            recordStream?.getTracks().forEach((t)=>t.stop());
            recording = false;
            const cancelled = mediaRecorder?.cancelled;
            if (!cancelled && chunks.length) {
                try {
                    const mime = mediaRecorder?.mimeType || 'audio/webm', blob = new Blob(chunks, {
                        type: mime
                    }), ext = mime.includes('mp4') ? '.m4a' : mime.includes('ogg') ? '.ogg' : '.webm', f = await putFile(blob, 'ملاحظة صوتية ' + new Date().toLocaleTimeString('ar') + ext);
                    add(cid, {
                        kind: 'attachment',
                        file: f,
                        own: true
                    });
                    toast('تم حفظ الملاحظة الصوتية.');
                } catch  {
                    toast('تعذّر حفظ التسجيل.');
                }
            } else toast('أُلغي التسجيل.');
            refresh(true);
        };
        mediaRecorder.start();
        recording = true;
        recordStart = Date.now();
        refresh();
        recordTimer = setInterval(()=>{
            const sec = Math.floor((Date.now() - recordStart) / 1000), el = document.querySelector('#record-time');
            if (el) el.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
            if (sec >= 300) mediaRecorder?.stop();
        }, 500);
    } catch  {
        recording = false;
        toast('لم يُسمح بالميكروفون. يمكنك السماح له من المتصفح أو إرفاق تسجيل جاهز.');
    }
}
async function offline() {
    if (!('serviceWorker' in navigator)) {
        toast('المتصفح لا يدعم التنزيل دون إنترنت.');
        return;
    }
    toast('جاري تنزيل ملفات الدراسة…');
    try {
        const reg = await navigator.serviceWorker.ready;
        const files = [
            './',
            'index.html',
            'app.css',
            'app.js',
            'catalog.js',
            'arabic.ttf',
            'arabic-bold.ttf',
            'icon.svg',
            'icon-192.png',
            'icon-512.png',
            'manifest.webmanifest',
            ...[
                'data.js',
                'course-data.js',
                'study-data.js',
                'study.js',
                'coverage-data.js',
                'index.html',
                'app.js',
                'experience.js',
                'lessons.js',
                'lessons.css',
                'identity.css',
                'style.css',
                'study.css'
            ].map((x)=>'paper-' + x),
            ...C.documents.map((d)=>'' + encodeURIComponent(d.source)),
            'arabic.ttf',
            'arabic-bold.ttf',
            'inter.ttf'
        ];
        const channel = new MessageChannel();
        channel.port1.onmessage = (e)=>{
            toast(e.data.ok ? 'اكتمل تنزيل محتوى الدراسة. افتح muc من نفس المتصفح للمراجعة دون إنترنت.' : 'بعض الملفات لم تكتمل. جرّب التنزيل مع اتصال مستقر.');
        };
        reg.active?.postMessage({
            type: 'CACHE_COURSE',
            files
        }, [
            channel.port2
        ]);
    } catch  {
        toast('تعذّر تنزيل المحتوى. تأكد من الاتصال وأعد المحاولة.');
    }
}
function exportState() {
    const blob = new Blob([
        JSON.stringify({
            app: 'muc',
            version: 1,
            exported: new Date().toISOString(),
            state
        }, null, 2)
    ], {
        type: 'application/json'
    }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = 'muc-study-backup.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    toast('تم تصدير التقدم والنصوص. احتفظ بمرفقاتك بشكل منفصل.');
}
function cleanBackup(raw) {
    const safe = (v)=>typeof v === 'string' && /^[a-zA-Z0-9:_-]{1,120}$/.test(v) && ![
            '__proto__',
            'constructor',
            'prototype'
        ].includes(v);
    const x = {
        messages: {},
        saved: [],
        starred: [],
        custom: [],
        reactions: {},
        pins: {},
        quiz: {},
        caseDrafts: {},
        grades: {}
    };
    for (const [cid, ms] of Object.entries(raw?.messages || {})){
        if (!safe(cid) || !Array.isArray(ms)) continue;
        x.messages[cid] = ms.filter((m)=>safe(m?.id) && [
                'text',
                'lesson',
                'question',
                'welcome',
                'paper',
                'attachment',
                'sticker'
            ].includes(m.kind) && (!m.file || safe(m.file.id) && typeof m.file.name === 'string' && typeof m.file.type === 'string')).map((m)=>({
                ...m,
                chat: cid,
                ref: safe(m.ref) ? m.ref : undefined,
                stamp: typeof m.stamp === 'number' && Number.isFinite(m.stamp) ? m.stamp : undefined,
                own: !!m.own,
                content: typeof m.content === 'string' ? m.content.slice(0, 30000) : '',
                reply: safe(m.reply) ? m.reply : undefined,
                forwarded: typeof m.forwarded === 'string' ? m.forwarded.slice(0, 100) : undefined
            }));
    }
    x.custom = (Array.isArray(raw?.custom) ? raw.custom : []).filter((c)=>safe(c?.id) && c.id.startsWith('custom-') && typeof c.title === 'string').map((c)=>({
            ...c,
            title: c.title.slice(0, 70),
            desc: typeof c.desc === 'string' ? c.desc.slice(0, 300) : '',
            symbol: typeof c.symbol === 'string' ? c.symbol.slice(0, 5) : 'م',
            color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#7b8fcb'
        }));
    x.saved = (Array.isArray(raw?.saved) ? raw.saved : []).filter(safe);
    x.starred = (Array.isArray(raw?.starred) ? raw.starred : []).filter((v)=>typeof v === 'string' && v.length < 160);
    for (const [k, v] of Object.entries(raw?.reactions || {}))if (safe(k) && typeof v === 'string' && v.length < 24) x.reactions[k] = v;
    for (const [k, v] of Object.entries(raw?.pins || {}))if (safe(k) && (Array.isArray(v) || typeof v === 'boolean')) x.pins[k] = Array.isArray(v) ? v.filter(safe) : v;
    for (const field of [
        'quiz',
        'caseDrafts',
        'grades'
    ])for (const [k, v] of Object.entries(raw?.[field] || {}))if (safe(k) && [
        'string',
        'number',
        'boolean'
    ].includes(typeof v)) x[field][k] = typeof v === 'string' ? v.slice(0, 30000) : v;
    return x;
}
function importState() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async ()=>{
        try {
            const data = JSON.parse(await input.files[0].text());
            if (data.app !== 'muc' || data.version !== 1 || !Array.isArray(data.state.saved) || typeof data.state.messages !== 'object') throw new Error();
            data.state = cleanBackup(data.state);
            sheet('استيراد تقدم الدراسة', `<p>النسخة بتاريخ ${esc(new Date(data.exported).toLocaleDateString('ar'))}. سيتم دمج الرسائل والمحفوظات والإجابات على هذا الجهاز.</p><button class="primary" id="confirm-import">استيراد ودمج</button>`);
            document.querySelector('#confirm-import').onclick = ()=>{
                for (const [cid, ms] of Object.entries(data.state.messages)){
                    if (!Array.isArray(ms)) continue;
                    const current = state.messages[cid] || [], ids = new Set(current.map((m)=>m.id));
                    state.messages[cid] = [
                        ...current,
                        ...ms.filter((m)=>!ids.has(m.id) && typeof m.content !== 'object' && typeof m.id === 'string')
                    ];
                }
                ;
                state.custom = [
                    ...state.custom,
                    ...(Array.isArray(data.state.custom) ? data.state.custom : []).filter((c)=>typeof c.id === 'string' && typeof c.title === 'string' && !state.custom.some((x)=>x.id === c.id))
                ];
                state.reactions = {
                    ...data.state.reactions,
                    ...state.reactions
                };
                state.pins = {
                    ...data.state.pins,
                    ...state.pins
                };
                state.saved = [
                    ...new Set([
                        ...state.saved,
                        ...data.state.saved
                    ])
                ];
                state.starred = [
                    ...new Set([
                        ...state.starred,
                        ...data.state.starred || []
                    ])
                ];
                state.quiz = {
                    ...data.state.quiz,
                    ...state.quiz
                };
                state.caseDrafts = {
                    ...data.state.caseDrafts,
                    ...state.caseDrafts
                };
                state.grades = {
                    ...data.state.grades,
                    ...state.grades
                };
                persist();
                closeOverlay();
                refresh();
                toast('تم دمج النسخة المحفوظة.');
            };
        } catch  {
            toast('هذا ليس ملف نسخة احتياطية صالحًا من muc.');
        }
    };
    input.click();
}
function bindInputs() {
    const gs = document.querySelector('#global-search');
    if (gs) gs.oninput = ()=>{
        query = gs.value;
        renderChatList();
    };
    const input = document.querySelector('#composer-input');
    if (input) {
        input.oninput = ()=>{
            state.drafts[active] = input.value;
            persist();
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 110) + 'px';
        };
        input.onkeydown = (e)=>{
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                sendText();
            }
        };
    }
    const range = document.querySelector('#font-range');
    if (range) range.oninput = ()=>{
        state.preferences.font = Number(range.value);
        applyTheme();
        persist();
        document.querySelector('#font-label').textContent = range.value;
    };
    const motion = document.querySelector('#motion-setting');
    if (motion) motion.onchange = ()=>{
        state.preferences.motion = motion.checked;
        persist();
        applyTheme();
    };
    const sound = document.querySelector('#sound-setting');
    if (sound) sound.onchange = ()=>{
        state.preferences.sounds = sound.checked;
        persist();
    };
}
function jump(mid) {
    const m = findMessage(mid);
    if (!m) return;
    closeOverlay();
    const go = ()=>{
        setTimeout(()=>{
            const el = document.getElementById('msg-' + mid);
            el?.scrollIntoView({
                behavior: state.preferences.motion ? 'smooth' : 'instant',
                block: 'center'
            });
            el?.classList.add('message-flash');
            setTimeout(()=>el?.classList.remove('message-flash'), 1500);
        }, 70);
    };
    if (active !== m.chat) {
        openChat(m.chat);
        go();
    } else go();
}
function wrongReview() {
    const list = allMessages().filter((m)=>m.kind === 'question' && (state.reactions[m.id] === '🔁' || state.quiz[m.id] !== undefined && !correct(qMap.get(m.ref), state.quiz[m.id])));
    sheet('نقاط تحتاج مراجعة', list.length ? `<div class="toc-list">${list.map((m)=>`<button data-action="jump" data-id="${m.id}">${icon('reply')}<span><strong>${esc(messageText(m).slice(0, 130))}</strong><small>${esc(chatBy(m.chat)?.title)}</small></span></button>`).join('')}</div>` : '<div class="empty-state">ما عندك أخطاء مسجلة بعد. تفاعل بـ🔁 على سؤال لتضيفه هون.</div>');
}
function starred() {
    sheet('كلماتي', state.starred.length ? `<div class="starred-list">${state.starred.map((k)=>{
        const f = factMap.get(k.startsWith('term:') ? TERM_FACTS[k.slice(5)] : k);
        return `<button data-action="keyword" data-id="${esc(k)}">${icon('star')}<span dir="auto">${esc(k.startsWith('term:') ? k.slice(5) : f?.answer || 'كلمة من حالة دراسية')}</span></button>`;
    }).join('')}</div>` : '<div class="empty-state">اضغط كلمة مضيئة، وبعدها «احفظ الكلمة» لتظهر هون.</div>');
}
function removeMessages(mids) {
    state.deleted = [
        ...new Set([
            ...state.deleted,
            ...mids
        ])
    ];
    persist();
    closeOverlay();
    selection = false;
    selected = [];
    refresh();
    toast('تم إخفاء الرسائل من محادثتك.', ()=>{
        state.deleted = state.deleted.filter((x)=>!mids.includes(x));
        persist();
        refresh();
    });
}
function toggleSaved(mid) {
    state.saved = state.saved.includes(mid) ? state.saved.filter((x)=>x !== mid) : [
        ...state.saved,
        mid
    ];
    persist();
    closeOverlay();
    refresh();
    toast(state.saved.includes(mid) ? 'تمت الإضافة إلى الرسائل المحفوظة.' : 'أُزيلت من المحفوظات.');
}
async function action(name, el) {
    const key = el.dataset.id || '';
    switch(name){
        case 'chat':
            openChat(key);
            break;
        case 'back':
            rememberScroll();
            location.hash = '';
            break;
        case 'tab':
            rememberScroll();
            closeOverlay();
            location.hash = key === 'chats' ? '' : key;
            break;
        case 'folder':
            folder = key;
            query = '';
            render();
            break;
        case 'theme':
            state.preferences.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            persist();
            refresh();
            break;
        case 'new-chat':
            sheet('محادثة جديدة', `<p class="sheet-intro">افتح مادة جاهزة، أو أنشئ محادثة خاصة لملاحظات مادة أخرى.</p><button class="wide-option" data-action="materials">${icon('book')} المواد المتوفرة</button><form id="new-chat-form"><label>اسم المادة / المحادثة<input id="new-chat-name" maxlength="70" required placeholder="اسم المادة" autocomplete="off"></label><button class="primary" type="submit">إنشاء محادثة خاصة</button></form>`);
            break;
        case 'materials':
            materials();
            break;
        case 'profile':
            profile(key || active);
            break;
        case 'chat-menu':
            chatMenu(key || active);
            break;
        case 'message-menu':
            contextMenu(key);
            break;
        case 'close-overlay':
            closeOverlay();
            break;
        case 'help':
            help();
            break;
        case 'chat-pin':
            state.pins['chat:' + key] = !state.pins['chat:' + key];
            persist();
            closeOverlay();
            refresh();
            break;
        case 'chat-unread':
            if (!state.unread.includes(key)) state.unread.push(key);
            persist();
            closeOverlay();
            refresh();
            toast('عُيّنت كغير مقروءة.');
            break;
        case 'chat-archive':
            state.archived = state.archived.includes(key) ? state.archived.filter((x)=>x !== key) : [
                ...state.archived,
                key
            ];
            persist();
            closeOverlay();
            refresh();
            toast(state.archived.includes(key) ? 'نُقلت للأرشيف.' : 'أُعيدت للمحادثات.');
            break;
        case 'chat-mute':
            state.muted = state.muted.includes(key) ? state.muted.filter((x)=>x !== key) : [
                ...state.muted,
                key
            ];
            persist();
            closeOverlay();
            refresh();
            toast(state.muted.includes(key) ? 'أُسكتت المحادثة داخل المنصة.' : 'أُلغي إسكات المحادثة.');
            break;
        case 'chat-pins':
            {
                const ps = state.pins[key] || [];
                sheet('الرسائل المثبتة', ps.length ? `<div class="toc-list">${ps.map((mid)=>`<button data-action="jump" data-id="${mid}">${icon('pin')}<span>${esc(messageText(findMessage(mid)))}</span></button>`).join('')}</div>` : '<p class="empty-state">اضغط مطوّلًا على رسالة واختار تثبيت.</p>');
                break;
            }
        case 'chat-attachments':
            {
                const list = messages(key).filter((m)=>m.kind === 'attachment');
                sheet('الوسائط والمرفقات', list.length ? `<div class="source-library">${list.map((m)=>`<button data-action="view-file" data-id="${m.file.id}">${icon('file')} ${esc(m.file.name)}</button>`).join('')}</div>` : '<p class="empty-state">ما في مرفقات شخصية بعد. ملفات المحاضرات متاحة من معلومات المادة.</p>');
                break;
            }
        case 'chat-search':
            {
                const b = document.querySelector('#chat-search-bar');
                b.hidden = !b.hidden;
                if (!b.hidden) {
                    const field = document.querySelector('#chat-search-input');
                    field.focus();
                    field.oninput = ()=>{
                        chatQuery = field.value;
                        const feed = document.querySelector('#message-feed');
                        feed.innerHTML = messages(active).filter((m)=>!chatQuery || messageText(m).toLowerCase().includes(chatQuery.toLowerCase())).map(renderMessage).join('') || '<div class="empty-state">لا توجد رسالة مطابقة.</div>';
                    };
                }
                break;
            }
        case 'chat-search-close':
            chatQuery = '';
            refresh();
            break;
        case 'bottom':
            document.querySelector('.feed-end')?.scrollIntoView({
                behavior: 'smooth'
            });
            break;
        case 'jump':
            jump(key);
            break;
        case 'toc':
            toc(key || active);
            break;
        case 'source-library':
            sourceLibrary();
            break;
        case 'papers':
            papers(key);
            break;
        case 'open-paper':
            openPaper(key);
            break;
        case 'review':
            location.hash = 'review';
            closeOverlay();
            break;
        case 'next-lesson':
            sendLesson(active);
            break;
        case 'send-lesson':
            {
                const target = el.dataset.chat || active;
                if (active !== target) openChat(target);
                sendLesson(target, key);
                closeOverlay();
                break;
            }
        case 'next-question':
            sendQuestion(active);
            break;
        case 'next-case':
            sendQuestion(active, true);
            break;
        case 'practice-section':
            {
                const c = chapterMap.get(key);
                const q = c?.questions.find((r)=>qMap.get(r.id)?.type !== 'case');
                if (q) sendQuestion(active, false, true, q.id);
                break;
            }
        case 'level':
            state.level = key;
            persist();
            refresh();
            break;
        case 'keyword':
            openKeyword(key);
            break;
        case 'star-word':
            state.starred = state.starred.includes(key) ? state.starred.filter((x)=>x !== key) : [
                ...state.starred,
                key
            ];
            persist();
            openKeyword(key);
            toast(state.starred.includes(key) ? 'حُفظت في كلماتي.' : 'أُزيلت من كلماتي.');
            break;
        case 'keyword-practice':
            {
                let q = key.startsWith('q:') ? qMap.get(key.slice(2).split(':')[0]) : questions.find((q)=>q.factId === (key.startsWith('term:') ? TERM_FACTS[key.slice(5)] : key));
                if (q) {
                    const target = subjectBy(active) ? active : subjects.find((s)=>s.exams.includes(q.exam.id))?.id || 'networks';
                    if (active !== target) openChat(target);
                    sendQuestion(target, q.type === 'case', true, q.id);
                    closeOverlay();
                }
                break;
            }
        case 'choose':
            state.quiz[key] = el.dataset.value;
            state.revealed[key] = true;
            persist();
            refresh();
            haptic();
            if (correct(qMap.get(findMessage(key)?.ref), el.dataset.value)) burst('✨');
            break;
        case 'reveal':
            state.revealed[key] = !state.revealed[key];
            persist();
            refresh();
            break;
        case 'retry':
            delete state.quiz[key];
            delete state.revealed[key];
            persist();
            refresh();
            break;
        case 'reaction':
            reaction(key, el.dataset.emoji || '❤️');
            break;
        case 'all-reactions':
            sheet('اختر تفاعلك', `<div class="emoji-grid">${[
                '👍',
                '👎',
                '❤️',
                '🔥',
                '🥰',
                '👏',
                '😁',
                '🤔',
                '🤯',
                '😱',
                '🤩',
                '🎉',
                '🤗',
                '🫡',
                '💡',
                '🔁',
                '✅',
                '💯',
                '🧠',
                '☕',
                '✨',
                '📚',
                '💪',
                '🚀',
                '👀',
                '🥳',
                '😎',
                '😴'
            ].map((e)=>`<button data-action="reaction" data-id="${key}" data-emoji="${e}">${e}</button>`).join('')}</div>`);
            break;
        case 'reply':
            setReply(key);
            break;
        case 'reply-cancel':
            replyTo = '';
            editId = '';
            document.querySelector('#reply-preview').innerHTML = replyBar();
            break;
        case 'save':
            toggleSaved(key);
            break;
        case 'copy':
            {
                try {
                    await navigator.clipboard.writeText(messageText(findMessage(key)));
                    toast('نُسخ النص.');
                    closeOverlay();
                } catch  {
                    sheet('نسخ النص', `<textarea class="copy-area" readonly>${esc(messageText(findMessage(key)))}</textarea><p>حدد النص لنسخه.</p>`);
                }
                break;
            }
        case 'forward':
            forwardPicker([
                key
            ]);
            break;
        case 'forward-to':
            {
                const mids = JSON.parse(el.dataset.mids || '[]');
                for (const mid of mids){
                    const m = findMessage(mid);
                    if (m) add(key, {
                        ...m,
                        id: id(),
                        chat: key,
                        own: true,
                        stamp: Date.now(),
                        forwarded: chatBy(m.chat)?.title
                    });
                }
                selection = false;
                selected = [];
                closeOverlay();
                openChat(key);
                scrollPositions[key] = Number.MAX_SAFE_INTEGER;
                render();
                toast('تم تحويل الرسائل.');
                break;
            }
        case 'pin':
            {
                const pins = state.pins[active] || [];
                state.pins[active] = pins.includes(key) ? pins.filter((x)=>x !== key) : [
                    key,
                    ...pins
                ];
                persist();
                closeOverlay();
                refresh();
                break;
            }
        case 'select':
            selection = true;
            selected = [
                key
            ];
            closeOverlay();
            refresh();
            break;
        case 'select-message':
            selected = selected.includes(key) ? selected.filter((x)=>x !== key) : [
                ...selected,
                key
            ];
            refresh();
            break;
        case 'select-cancel':
            selection = false;
            selected = [];
            refresh();
            break;
        case 'selected-save':
            state.saved = [
                ...new Set([
                    ...state.saved,
                    ...selected
                ])
            ];
            selection = false;
            selected = [];
            persist();
            refresh();
            toast('حُفظت الرسائل المحددة.');
            break;
        case 'selected-forward':
            if (selected.length) forwardPicker(selected);
            break;
        case 'selected-delete':
            if (selected.length) removeMessages(selected);
            break;
        case 'delete-message':
            removeMessages([
                key
            ]);
            break;
        case 'edit-message':
            {
                const m = findMessage(key);
                if (!m?.own) return;
                editId = key;
                replyTo = '';
                state.drafts[active] = m.content;
                closeOverlay();
                refresh();
                document.querySelector('#composer-input')?.focus();
                break;
            }
        case 'send':
            sendText();
            break;
        case 'emoji':
            showEmoji();
            break;
        case 'stickers':
            showEmoji(true);
            break;
        case 'insert-emoji':
            {
                closeOverlay();
                const input = document.querySelector('#composer-input');
                if (input) {
                    input.value += key;
                    state.drafts[active] = input.value;
                    persist();
                    input.focus();
                } else toast('افتح محادثة لإضافة رسالة.');
                break;
            }
        case 'send-sticker':
            if (active) {
                add(active, {
                    kind: 'sticker',
                    content: key,
                    own: true
                });
                closeOverlay();
                refresh(true);
                burst(key);
            }
            break;
        case 'attach':
            attachmentPicker();
            break;
        case 'pick-image':
            chooseFile(true);
            break;
        case 'pick-document':
            chooseFile();
            break;
        case 'view-file':
            await viewFile(key);
            break;
        case 'voice':
            await voice();
            break;
        case 'voice-cancel':
            await voice(true);
            break;
        case 'appearance':
            state.preferences.theme = key;
            persist();
            refresh();
            break;
        case 'wallpaper':
            state.preferences.wallpaper = key;
            persist();
            refresh();
            break;
        case 'export':
            exportState();
            break;
        case 'import':
            importState();
            break;
        case 'offline':
            await offline();
            break;
        case 'install':
            if (installPrompt) {
                installPrompt.prompt();
                await installPrompt.userChoice;
                installPrompt = null;
            } else sheet('muc على شاشتك', `<p>على iPhone: افتح الموقع في Safari، اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</p><p>على Android: من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p><p>بعد الإضافة يفتح muc كتطبيق مستقل. ويمكنك تنزيل المادة من الإعدادات للمراجعة دون إنترنت.</p>`);
            break;
        case 'wrong-review':
            wrongReview();
            break;
        case 'starred':
            starred();
            break;
    }
}
let suppressClickUntil = 0;
document.addEventListener('click', (e)=>{
    if (Date.now() < suppressClickUntil) {
        e.preventDefault();
        return;
    }
    const el = e.target.closest('[data-action]');
    if (el) {
        e.preventDefault();
        action(el.dataset.action, el).catch(()=>toast('تعذّر تنفيذ الخطوة. جرّب مرة ثانية.'));
    }
});
document.addEventListener('submit', (e)=>{
    const form = e.target;
    e.preventDefault();
    if (form.classList.contains('blank-form')) {
        const mid = form.dataset.mid, input = form.querySelector('input');
        if (!input.value.trim()) {
            input.focus();
            return;
        }
        state.quiz[mid] = input.value;
        state.revealed[mid] = true;
        persist();
        refresh();
        return;
    }
    if (form.id === 'new-chat-form') {
        const title = document.querySelector('#new-chat-name').value.trim();
        if (!title) return;
        const c = {
            id: 'custom-' + id(),
            title,
            desc: 'ملاحظات وملفات شخصية',
            symbol: title.slice(0, 1),
            color: '#7b8fcb'
        };
        state.custom.push(c);
        persist();
        closeOverlay();
        openChat(c.id);
    }
});
document.addEventListener('input', (e)=>{
    const el = e.target;
    if (el.classList.contains('case-draft')) {
        state.caseDrafts[el.dataset.mid + ':' + el.dataset.part] = el.value;
        persist();
    }
    if (el.dataset.grade) {
        const max = Number(el.max);
        if (el.value === '') delete state.grades[el.dataset.grade];
        else state.grades[el.dataset.grade] = Math.max(0, Math.min(max, Number(el.value) || 0));
        persist();
    }
});
document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') {
        if (overlays.childNodes.length) closeOverlay();
        else if (replyTo || editId) {
            replyTo = '';
            editId = '';
            refresh();
        } else if (active) location.hash = '';
    }
    if (e.key === 'Tab' && overlays.childNodes.length) {
        const items = Array.from(overlays.querySelectorAll('button,a,input,textarea,select')).filter((x)=>x.offsetParent !== null);
        if (items.length) {
            const first = items[0], last = items.at(-1);
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
});
let gesture = null;
document.addEventListener('pointerdown', (e)=>{
    const target = e.target;
    if (target.closest('button,input,textarea,a,summary,audio') && !target.closest('.chat-open')) return;
    const msg = target.closest('.message'), row = target.closest('[data-chatrow]');
    if (!msg && !row) return;
    const mid = msg?.dataset.mid, cid = row?.dataset.chatrow;
    gesture = {
        x: e.clientX,
        y: e.clientY,
        dx: 0,
        el: msg,
        rowel: row,
        mid,
        cid,
        timer: setTimeout(()=>{
            suppressClickUntil = Date.now() + 450;
            if (mid) contextMenu(mid);
            else if (cid) chatMenu(cid);
            gesture = null;
        }, 500)
    };
});
document.addEventListener('pointermove', (e)=>{
    if (!gesture) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (Math.abs(dx) + Math.abs(dy) > 9) clearTimeout(gesture.timer);
    if ((gesture.el || gesture.rowel) && dx < -8 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        gesture.dx = dx;
        (gesture.el?.querySelector('.bubble') || gesture.rowel.querySelector('.chat-open')).style.transform = `translateX(${Math.max(-78, dx)}px)`;
        (gesture.el || gesture.rowel).classList.add('swiping');
        if (e.cancelable) e.preventDefault();
    } else if (Math.abs(dy) > 15) {
        clearGesture();
    }
}, {
    passive: false
});
function clearGesture() {
    if (gesture) {
        clearTimeout(gesture.timer);
        if (gesture.el) {
            (gesture.el?.querySelector('.bubble') || gesture.rowel.querySelector('.chat-open')).style.transform = '';
            gesture.el.classList.remove('swiping');
        }
        if (gesture.rowel) {
            gesture.rowel.querySelector('.chat-open').style.transform = '';
            gesture.rowel.classList.remove('swiping');
        }
        gesture = null;
    }
}
document.addEventListener('pointerup', ()=>{
    if (gesture?.cid && gesture.dx < -65) {
        const cid = gesture.cid;
        clearGesture();
        state.archived = state.archived.includes(cid) ? state.archived.filter((x)=>x !== cid) : [
            ...state.archived,
            cid
        ];
        persist();
        suppressClickUntil = Date.now() + 200;
        refresh();
        toast('تم تحديث الأرشيف.', ()=>{
            state.archived = state.archived.includes(cid) ? state.archived.filter((x)=>x !== cid) : [
                ...state.archived,
                cid
            ];
            persist();
            refresh();
        });
        return;
    }
    if (gesture?.mid && gesture.dx < -48) {
        setReply(gesture.mid);
        suppressClickUntil = Date.now() + 150;
    }
    clearGesture();
});
document.addEventListener('pointercancel', clearGesture);
document.addEventListener('contextmenu', (e)=>{
    const msg = e.target.closest('[data-mid]'), row = e.target.closest('[data-chatrow]');
    if (msg?.dataset.mid) {
        e.preventDefault();
        contextMenu(msg.dataset.mid);
    } else if (row) {
        e.preventDefault();
        chatMenu(row.dataset.chatrow);
    }
});
document.addEventListener('dblclick', (e)=>{
    if (e.target.closest('button,input,textarea,a,summary')) return;
    const msg = e.target.closest('.message');
    if (msg) reaction(msg.dataset.mid, '❤️');
});
window.addEventListener('hashchange', route);
window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    installPrompt = e;
});
window.addEventListener('beforeunload', ()=>{
    if (mediaRecorder) mediaRecorder.cancelled = true;
    recordStream?.getTracks().forEach((t)=>t.stop());
});
if ('serviceWorker' in navigator) window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
route();
