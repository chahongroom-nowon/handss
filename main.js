(() => {
    "use strict";

    class FrameObserver {
        constructor(e = {}) {
            this.frameName = e.frameName || "mainFrame",
            this.processInterval = e.processInterval || 1e3,
            this.debounceDelay = e.debounceDelay || 500,
            this.observer = null,
            this.mutationTimeout = null,
            this.lastProcessTime = 0,
            this.onProcess = e.onProcess || (() => {})
        }
        async waitForElement(e, t, o = 5e3) {
            return new Promise(((n, s) => {
                const r = Date.now();
                !function i() {
                    const a = e.querySelector(t);
                    a ? n(a) : Date.now() - r >= o ? s(new Error(`요소(${t})를 ${o}ms 내에 찾지 못했습니다.`)) : setTimeout(i, 100)
                }()
            }))
        }
        processMutations() {
            this.mutationTimeout && clearTimeout(this.mutationTimeout),
            this.mutationTimeout = setTimeout((() => {
                const e = Date.now();
                if (e - this.lastProcessTime >= this.processInterval) try {
                    const t = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
                    t && (t.contentDocument || t.contentWindow.document) && (this.onProcess(t.contentDocument || t.contentWindow.document), this.lastProcessTime = e)
                } catch (e) {
                    console.error("❌ process() 실행 중 오류:", e)
                }
            }), this.debounceDelay)
        }
        initializeObserver() {
            const e = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
            if (e && e.contentDocument && e.contentDocument.body) {
                this.observer && this.observer.disconnect(),
                this.observer = new MutationObserver((() => this.processMutations())),
                this.observer.observe(e.contentDocument.body, { childList: !0, subtree: !0, characterData: !0, attributes: !0 }),
                this.onProcess(e.contentDocument)
            }
        }
        start() {
            const e = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
            e ? (e.addEventListener("load", (() => this.initializeObserver())), "complete" === e.contentDocument?.readyState && this.initializeObserver()) : console.error(`❌ ${this.frameName} 요소를 찾을 수 없습니다.`),
            "complete" === document.readyState ? this.initializeObserver() : window.addEventListener("load", (() => {
                const e = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
                "complete" === e?.contentDocument?.readyState ? this.initializeObserver() : setTimeout((() => this.initializeObserver()), 500)
            }))
        }
    }

    const PreventDelete = new class {
        constructor() { this.observer = new FrameObserver({ frameName: "mainFrame", onProcess: e => this.processFrame(e) }) }
        processFrame(e) {
            e.querySelectorAll('a[title="예약금지삭제"], a[onclick^="jsReserveStop"]').forEach((t => {
                if ("true" === t.dataset.confirmInjected) return;
                t.dataset.confirmInjected = "true";
                const o = t.getAttribute("onclick");
                t.onclick = n => {
                    n.preventDefault();
                    if (confirm("! 예약금지를 취소하셨습니다 !\n! 실수로 누른 경우 다시 예약을 꼭 막아주세요 !")) {
                        if (o) {
                            const e = o.match(/jsStopTimeDel\((.*)\)/);
                            if (e) {
                                const o = e[1].split(",").map((e => e.trim().replace(/^'(.*)'$/, "$1"))),
                                    s = n.defaultView;
                                if ("function" == typeof s.jsStopTimeDel) s.jsStopTimeDel(...o.slice(0, 6), t);
                            }
                        }
                    }
                }
            }))
        }
        start() { this.observer.start() }
    };

    const StaffButtons = new class {
        constructor() {
            this.waitingNames = ["재희W", "광숙W", "지후W", "가은W", "정현W", "소연W", "지은W", "희진W", "소이W", "예나W", "주아W", "나연W"],
            this.batchPattern = [4, 3, 2, 2, 1],
            this.observer = new FrameObserver({ frameName: "mainFrame", onProcess: e => this.processFrame(e) })
        }
        getWaitingButtonsHTML() {
            let e = '<ul style="margin:0; padding:0;">', t = 0, o = 0, n = this.batchPattern[t] || 3;
            this.waitingNames.forEach(((s, r) => {
                0 === o && (e += '<li style="display:block; margin:4px 0;">'),
                e += `\n <span class="nBtn line jwaiting" style="cursor:pointer; display:inline-block; padding:2px 8px; border:1px solid #ccc; border-radius:3px; margin-right:4px;">${s}</span>`,
                o++, (o >= n || r === this.waitingNames.length - 1) && (e += "</li>", o = 0, t < this.batchPattern.length - 1 && (t++, n = this.batchPattern[t]))
            }));
            return e += "</ul>", e
        }
        async processFrame(e) {
            const t = e.querySelector("div#cashReceiptLayer");
            if (!t) return;
            const o = t.parentElement;
            const n = Array.from(o.children).find((e => "TABLE" === e.tagName && e !== t));
            if (n && "true" !== n.dataset.buttonsAdded) {
                n.insertAdjacentHTML("beforeend", this.getWaitingButtonsHTML());
                n.dataset.buttonsAdded = "true";
                e.querySelectorAll(".nBtn.line.jwaiting").forEach((t => {
                    t.addEventListener("click", (async (o) => {
                        o.preventDefault();
                        const staffName = t.innerText.trim();
                        try {
                            (await this.observer.waitForElement(e, 'td.tal.tind[onclick="linkSelectCateg_Change(this);"]')).click(),
                            (await this.observer.waitForElement(e, 'td[onclick*="categChange"][onclick*="시술전"]')).click(),
                            (await this.observer.waitForElement(e, 'td.m2[id*="시술중"]')).click();
                            const memo = e.getElementById("strMemo");
                            if (memo) memo.value = memo.value + `\n\n1.\n2.${staffName}\n3.\n4.`;
                        } catch (err) { console.error(err) }
                    }))
                }))
            }
        }
        start() { this.observer.start() }
    };

    const CardAutoReplacement = new class {
        constructor() {
            this.StaffSettings = {
                "정예은": { sex: "strCategSex0", length: "strCategREQUIRED7", cutId: "hairTagPlaceCodeFEMALE96", permId: "hairTagPlaceCodeFEMALE97", colorId: "hairTagPlaceCodeFEMALE55" },
                "윤서희": { sex: "strCategSex0", length: "strCategREQUIRED5", cutId: "hairTagPlaceCodeFEMALE13", permId: "hairTagPlaceCodeFEMALE23", colorId: "hairTagPlaceCodeFEMALE55" },
                "정진아": { sex: "strCategSex0", length: "strCategREQUIRED5", cutId: "hairTagPlaceCodeFEMALE13", permId: "hairTagPlaceCodeFEMALE107", colorId: "hairTagPlaceCodeFEMALE55" },
                "이수민": { sex: "strCategSex0", length: "strCategREQUIRED6", cutId: "hairTagPlaceCodeFEMALE13", permId: "hairTagPlaceCodeFEMALE36", colorId: "hairTagPlaceCodeFEMALE55" },
                "나시은": { sex: "strCategSex0", length: "strCategREQUIRED5", cutId: "hairTagPlaceCodeFEMALE13", permId: "hairTagPlaceCodeFEMALE107", colorId: "hairTagPlaceCodeFEMALE55" },
                "문희선": { sex: "strCategSex0", length: "strCategREQUIRED5", cutId: "hairTagPlaceCodeFEMALE91", permId: "hairTagPlaceCodeFEMALE165", colorId: "hairTagPlaceCodeFEMALE55" },
                "예윤진": { sex: "strCategSex0", length: "strCategREQUIRED5", cutId: "hairTagPlaceCodeFEMALE13", permId: "hairTagPlaceCodeFEMALE32", colorId: "hairTagPlaceCodeFEMALE46" }
            };
            this.observer = new FrameObserver({ frameName: "mainFrame", onProcess: e => this.processFrame(e) })
        }
        processFrame(doc) {
            const payBtn = doc.querySelector("#btn_NPay0");
            if (payBtn && !payBtn.dataset.listenerAttached) {
                payBtn.addEventListener("click", () => {
                    const staffEl = doc.querySelector('.linkSelectStaff');
                    const staffName = staffEl ? staffEl.innerText.trim() : null;
                    if (staffName && this.StaffSettings[staffName]) {
                        const cfg = this.StaffSettings[staffName];
                        const timer = setInterval(() => {
                            const popup = doc.querySelector("div#nPayCate");
                            if (popup) {
                                clearInterval(timer);
                                [cfg.sex, cfg.length, cfg.cutId, cfg.permId, cfg.colorId].forEach(id => {
                                    popup.querySelector(`input[id="${id}"], label[for="${id}"]`)?.click();
                                });
                            }
                        }, 100);
                    }
                });
                payBtn.dataset.listenerAttached = "true";
            }

            // [수정된 부분] 네이버페이 버튼의 부모(td)를 찾아 그 안에 C모드/지오 버튼 생성
            if (payBtn && !payBtn.dataset.cmodeProcessed) {
                const parentTd = payBtn.parentElement;
                
                const btnC = document.createElement("input");
                btnC.type = "button"; btnC.value = "C모드";
                btnC.style.cssText = "height:30px; padding:0 10px; cursor:pointer; background:#5f748a; color:#fff; border:1px solid #4d5e70; border-radius:3px; font-weight:bold; margin:0 5px;";
                btnC.onclick = () => {
                    doc.querySelector("td.tal.tind")?.click();
                    setTimeout(() => {
                        const btns = doc.querySelectorAll('td.m3[onclick*="pkDisEvent_Change"]');
                        if (btns.length >= 2) {
                            btns[1].click();
                            const p = doc.querySelector("input#nGoodsPrice_Sum");
                            if (p) { p.value = "33000"; p.dispatchEvent(new Event("keyup")); }
                            const m = doc.querySelector("select#pkSaleMemo");
                            if (m) { m.value = "7468"; m.dispatchEvent(new Event("change")); }
                        }
                    }, 300);
                };

                const btnGeo = document.createElement("input");
                btnGeo.type = "button"; btnGeo.value = "C모드지오";
                btnGeo.style.cssText = "height:30px; padding:0 10px; cursor:pointer; background:#4a90e2; color:#fff; border:1px solid #357abd; border-radius:3px; font-weight:bold;";
                btnGeo.onclick = () => {
                    const m = doc.querySelector("select#pkSaleMemo");
                    if (m) { m.value = "7469"; m.dispatchEvent(new Event("change")); }
                    else { alert("메모 선택창을 찾을 수 없습니다."); }
                };

                parentTd.appendChild(btnC);
                parentTd.appendChild(btnGeo);
                payBtn.dataset.cmodeProcessed = "true";
            }
        }
        start() { this.observer.start() }
    };

    const ReservationStats = new class {
        constructor() {
            this.priority = ["펌", "컬러", "클리닉", "커트", "컨설팅"],
            this.normalizeMap = { 컷: "커트" },
            this.menuCounts = {},
            this.observer = new FrameObserver({ frameName: "mainFrame", onProcess: e => this.processFrame(e) }),
            this.countDisplay = null
        }
        processMenu(e = document) {
            const t = e.querySelectorAll("#today > table")[1];
            if (t) {
                this.menuCounts = {};
                t.querySelectorAll("tbody > tr").forEach((e => {
                    const t = (e.getAttribute("ismemo") || "").match(/예약시술메뉴\s*:\s*(.*?)\s*예약금/);
                    if (t) {
                        let o = t[1];
                        for (const [e, t] of Object.entries(this.normalizeMap)) o = o.replace(new RegExp(e, "g"), t);
                        const n = this.priority.find((e => o.includes(e)));
                        if (n) {
                            const td = e.querySelector("td:nth-of-type(4)");
                            if (td && "" === td.textContent.trim()) td.textContent = n;
                            this.menuCounts[n] = (this.menuCounts[n] || 0) + 1;
                        }
                    }
                }));
                this.updateCountDisplay();
            }
        }
        processFrame(e) { if (e.querySelector("#today")) this.processMenu(e); }
        updateCountDisplay() {
            const e = document.querySelector("frame#mainFrame");
            if (!e || !e.contentDocument) return;
            const t = e.contentDocument.querySelector("div#now_board");
            if (!t) return;
            if (!this.countDisplay) {
                this.countDisplay = document.createElement("div");
                this.countDisplay.id = "menu-count-display";
                this.countDisplay.style.cssText = "position:fixed; top:0; right:0; z-index:1000; background:white; border:1px solid #ccc; border-radius:5px; padding:10px; margin:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); min-width:200px;";
                t.appendChild(this.countDisplay);
            }
            let html = '<h3 style="margin:0 0 10px 0; font-size:16px; border-bottom:1px solid #eee;">금일 예약 목록</h3><ul style="list-style:none; padding:0; margin:0;">';
            this.priority.forEach(p => {
                const count = this.menuCounts[p] || 0;
                html += `<li style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f0f0f0;"><b>${p}</b><span style="background:#007bff; color:white; padding:2px 8px; border-radius:10px; font-size:12px;">${count}</span></li>`;
            });
            html += '</ul>';
            this.countDisplay.innerHTML = html;
        }
        start() { this.observer.start() }
    };

    const MemoNotice = new class {
        constructor() { this.observer = new FrameObserver({ frameName: "mainFrame", onProcess: e => this.processFrame(e) }) }
        processFrame(e) {
            try {
                e.querySelectorAll('textarea[id^="strMemo_"]').forEach((o) => {
                    const eventId = o.id.match(/strMemo_(\d+)/)?.[1];
                    if (eventId && o.value.includes("요청사항:")) {
                        const titleBox = e.querySelector(`div[event_id="${eventId}"] div.dhx_event_move.dhx_title`);
                        if (titleBox) {
                            titleBox.textContent = "요청사항 확인";
                            titleBox.style.background = "#546679";
                            titleBox.style.color = "#ffffff";
                            titleBox.style.fontWeight = "bold";
                        }
                    }
                });
                e.querySelectorAll("div.rDetail").forEach((detail) => {
                    const memoDiv = detail.querySelector("div > dl > dd:last-child > div.nrRMemo");
                    if (memoDiv && memoDiv.textContent.includes("요청사항:")) {
                        const inner = detail.parentElement.querySelector("div.rInner");
                        if (inner) inner.style.boxShadow = "inset 0 0 0 2px red";
                    }
                });
            } catch (err) {}
        }
        start() { this.observer.start() }
    };

    PreventDelete.start();
    StaffButtons.start();
    CardAutoReplacement.start();
    ReservationStats.start();
    MemoNotice.start();

})();
