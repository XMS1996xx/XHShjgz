/**
 * ============================================================
 *  小红书合辑 · 自动关注博主工具
 *  运行环境：Auto.js / AutoX.js（需开启无障碍服务 + 悬浮窗权限）
 * ------------------------------------------------------------
 *  使用步骤：
 *   0. 打开本软件（打包成 APP 后）的第一页面：
 *        先点「去开启」授予「无障碍服务」与「悬浮窗」两个权限
 *        （两个权限都显示「已开启」后）点「开始使用」
 *   1. 手动打开小红书，进入你要处理的「合辑」页面，并停留在该页面
 *   2. 点击悬浮窗上的「开始」
 *   3. 脚本自动遍历合辑内所有作品：
 *        进入作品详情页 -> 识别关注按钮
 *          未关注  -> 自动点击关注
 *          已关注  -> 自动跳过
 *        -> 自动返回合辑页 -> 处理下一个作品 -> 自动下滑加载更多
 *   5. 整个合辑处理完毕，脚本自动停止并显示统计结果
 * ------------------------------------------------------------
 *  悬浮窗按钮：开始 / 暂停 / 停止 / 退出
 *  统计信息：成功关注数 / 关注失败数 / 已关注跳过数
 *  间隔设置：可实时调整"每个作品的间隔秒数"（0 ~ 60 秒）
 * ============================================================
 */

// ============================================================
//  【应用首页】—— 打包成 APP 后打开软件的第一页面
//   1. 一键跳转系统设置开启「无障碍服务」权限
//   2. 一键跳转系统设置开启「悬浮窗」权限
//   3. 实时显示两个权限是否已开启
//   4. 权限齐全后点「开始使用」进入自动关注工具（弹出悬浮窗）
// ============================================================
"ui";

var started = false;   // 工具是否已启动（防止重复点「开始使用」开出多个悬浮窗）

ui.layout(
    <vertical padding="18" bg="#F7F7F7">
        <text text="小红书合辑 · 自动关注" textSize="22sp" gravity="center"
              textColor="#E53935" marginTop="26"/>
        <text text="使用前请先开启下面两个权限" textSize="13sp"
              textColor="#999999" gravity="center" marginTop="6"/>

        <horizontal bg="#FFFFFF" padding="14" marginTop="26" gravity="center_vertical">
            <vertical layout_weight="1">
                <text text="① 无障碍服务" textSize="15sp" textColor="#222222"/>
                <text id="accessState" text="检测中…" textSize="12sp"
                      textColor="#999999" marginTop="3"/>
            </vertical>
            <button id="btnAccess" text="去开启" w="86" h="38" textSize="13sp"/>
        </horizontal>

        <horizontal bg="#FFFFFF" padding="14" marginTop="8" gravity="center_vertical">
            <vertical layout_weight="1">
                <text text="② 悬浮窗权限" textSize="15sp" textColor="#222222"/>
                <text id="overlayState" text="检测中…" textSize="12sp"
                      textColor="#999999" marginTop="3"/>
            </vertical>
            <button id="btnOverlay" text="去开启" w="86" h="38" textSize="13sp"/>
        </horizontal>

        <button id="btnRun" text="开始使用" textSize="16sp" h="48" marginTop="34"
                bg="#E53935" textColor="#FFFFFF"/>

        <text text="使用步骤" textSize="13sp" textColor="#666666" marginTop="28"/>
        <text text="1、在小红书里打开要处理的「合辑」页面&#10;2、回到本应用点「开始使用」&#10;3、切回小红书，在弹出的悬浮窗中点「开始」"
              textSize="12sp" textColor="#888888" marginTop="8"/>
    </vertical>
);

// ---------------- 权限状态检测（每秒刷新一次） ----------------
function refreshPermissionUI() {
    var acc = false;
    try { acc = (auto.service != null); } catch (e) {}
    try {
        ui.accessState.setText(acc ? "已开启" : "未开启");
        ui.accessState.setTextColor(android.graphics.Color.parseColor(acc ? "#4CAF50" : "#F44336"));
    } catch (e) {}

    var ov = false;
    try { ov = android.provider.Settings.canDrawOverlays(context); } catch (e) { ov = true; }
    try {
        ui.overlayState.setText(ov ? "已开启" : "未开启");
        ui.overlayState.setTextColor(android.graphics.Color.parseColor(ov ? "#4CAF50" : "#F44336"));
    } catch (e) {}
}
refreshPermissionUI();
setInterval(refreshPermissionUI, 1000);

// ---------------- 一键打开权限设置 ----------------
function openAccessSettings() {
    try {
        app.startActivity({ action: "android.settings.ACCESSIBILITY_SETTINGS" });
        toast("请在列表中找到本应用，开启「无障碍服务」");
    } catch (e) {
        toast("打开失败，请手动到 设置-辅助功能-无障碍 开启");
    }
}
function openOverlaySettings() {
    var pkg = "";
    try { pkg = context.getPackageName(); } catch (e) {}
    if (pkg) {
        try {
            app.startActivity({
                action: "android.settings.action.MANAGE_OVERLAY_PERMISSION",
                data: "package:" + pkg
            });
            toast("请开启「显示在其他应用上层 / 悬浮窗」");
            return;
        } catch (e) {}
        try {
            app.startActivity({
                action: "android.settings.APPLICATION_DETAILS_SETTINGS",
                data: "package:" + pkg
            });
            toast("请在「应用详情」中开启悬浮窗权限");
            return;
        } catch (e) {}
    }
    try {
        app.startActivity({ action: "android.settings.action.MANAGE_OVERLAY_PERMISSION" });
    } catch (e) {
        toast("请手动到 设置-应用-本应用 开启悬浮窗权限");
    }
}

ui.btnAccess.on("click", openAccessSettings);
ui.btnOverlay.on("click", openOverlaySettings);

// ---------------- 「开始使用」：校验权限后启动工具 ----------------
ui.btnRun.on("click", function () {
    var acc = false;
    try { acc = (auto.service != null); } catch (e) {}
    if (!acc) { toast("请先开启无障碍权限"); openAccessSettings(); return; }

    var ov = false;
    try { ov = android.provider.Settings.canDrawOverlays(context); } catch (e) { ov = true; }
    if (!ov) { toast("请先开启悬浮窗权限"); openOverlaySettings(); return; }

    if (started) { toast("工具已在运行中"); try { home(); } catch (e) {} return; }
    started = true;

    // 在后台线程启动工具，避免阻塞首页界面
    threads.start(function () {
        startAutomation();
    });
    toast("已启动，请切回小红书，点悬浮窗「开始」");
    try { home(); } catch (e) {}
});

// 返回键不关闭首页（避免误退把正在运行的工具一起杀掉），改为切到手机桌面
ui.emitter.on("back_pressed", function (e) {
    e.consumed = true;
    try { home(); } catch (err) {}
});

// ---------------- 可调参数（按需修改） ----------------
var CFG = {
    waitCardClick: 2200,        // 点击作品封面后，等待详情页加载(ms)
    waitFollowClick: 1300,      // 点击"关注"后，等待状态刷新(ms)
    waitBack: 1800,             // 返回合辑页后，等待页面稳定(ms)
    waitSwipe: 2200,            // 滑动加载更多后，等待(ms)
    detailTimeout: 6000,        // 等待详情页出现关注按钮的超时(ms)
    followVerifyTimeout: 2500,  // 点击关注后，验证是否变为"已关注"的超时(ms)
    swipeStartY: 0.85,          // 滑动起点 Y（屏幕高度比例）
    swipeEndY: 0.15,            // 滑动终点 Y（屏幕高度比例）
    swipeDuration: 500,         // 滑动时长(ms)
    maxIdleSwipe: 5,            // 连续 N 次滑动都没有新作品 => 判定合辑已到底
    cardMinWidthRatio: 0.32,    // 作品卡片最小宽度 = 屏宽 * 该比例
    cardMaxWidthRatio: 0.62     // 作品卡片最大宽度 = 屏宽 * 该比例
};

// ---------------- 统计数据 ----------------
var stats = { success: 0, fail: 0, skip: 0 };

// ---------------- 运行设置（可在悬浮窗内实时调整） ----------------
var SETTINGS = {
    intervalMin: 2,  // 每个作品之间随机间隔的最小秒数
    intervalMax: 5   // 每个作品之间随机间隔的最大秒数
};

// ---------------- 运行状态 ----------------
var RUN = {
    active: false,  // 是否正在工作（点「开始」后为 true）
    paused: false,  // 是否暂停
    exit: false     // 是否退出脚本
};

// ---------------- 去重记录 ----------------
var visitedSig = {};      // 内容签名去重（跨屏幕）
var visitedScreen = [];   // 当前屏幕内已处理卡片的位置列表（带容差匹配，每次确认换屏后清空）

// ---------------- 悬浮窗对象、尺寸与位置（用于点击/滑动时避开悬浮窗，防止误触按键） ----------------
var win = null;               // 悬浮窗对象，进入工具后赋值
var winW = 200, winH = 260;   // 估值，运行后会读取真实尺寸
var wx = 60, wy = 320;        // 悬浮窗位置（可拖动）
var dragX = 0, dragY = 0, baseX = 0, baseY = 0;
function refreshWinSize() {
    try {
        var w = win.getWidth(), h = win.getHeight();
        if (w && w > 0) winW = w;
        if (h && h > 0) winH = h;
    } catch (e) {}
}
// 坐标是否落在悬浮窗范围内
function insideWin(x, y) {
    return x >= wx && x <= wx + winW && y >= wy && y <= wy + winH;
}

// ============================================================
//  一、自动关注工具主体（由首页「开始使用」按钮调用）
// ============================================================
function startAutomation() {

// 无障碍服务
auto.waitFor();

// 悬浮窗权限
// 说明：checkPermission / requestPermission 仅旧版 Auto.js 4.x 存在，
//       AutoJs6 已移除该 API，故此处做特性检测以兼容两种版本。
try {
    if (typeof floaty.checkPermission === "function" && !floaty.checkPermission()) {
        toast("请授予悬浮窗权限");
        if (typeof floaty.requestPermission === "function") {
            floaty.requestPermission();
        }
        var waited = 0;
        while (!floaty.checkPermission() && waited < 15000) {
            sleep(500);
            waited += 500;
        }
        if (!floaty.checkPermission()) {
            toast("未授予悬浮窗权限，脚本无法运行");
            exit();
        }
    }
} catch (e) {
    // AutoJs6 等无此 API 的版本：忽略，创建悬浮窗时会自动弹窗请求权限
}

// 悬浮窗界面：标题 + 统计 + 状态 + 间隔设置 + 功能按键
win = floaty.window(
    <vertical bg="#E6000000" padding="10">
        <text id="title" text="小红书合辑关注" textColor="#FFFFFF" textSize="14sp"
              gravity="center" padding="4"/>
        <text id="stat" text="成功 0 | 失败 0 | 跳过 0" textColor="#7CFC00"
              textSize="12sp" gravity="center" marginTop="2"/>
        <text id="status" text="状态：待机" textColor="#FFD700"
              textSize="12sp" gravity="center" marginTop="4"/>
        <horizontal marginTop="8" gravity="center">
            <text text="间隔" textColor="#FFFFFF" textSize="12sp"/>
            <button id="btnMinMinus" text="－" w="26" h="30" textSize="14sp" marginLeft="4"/>
            <text id="intervalMinVal" text="2" textColor="#7CFC00" textSize="12sp" marginLeft="2"/>
            <button id="btnMinPlus" text="＋" w="26" h="30" textSize="14sp" marginLeft="2"/>
            <text text="~" textColor="#FFFFFF" textSize="12sp" marginLeft="4"/>
            <button id="btnMaxMinus" text="－" w="26" h="30" textSize="14sp" marginLeft="4"/>
            <text id="intervalMaxVal" text="5" textColor="#7CFC00" textSize="12sp" marginLeft="2"/>
            <button id="btnMaxPlus" text="＋" w="26" h="30" textSize="14sp" marginLeft="2"/>
            <text text="秒" textColor="#FFFFFF" textSize="12sp" marginLeft="4"/>
        </horizontal>
        <horizontal marginTop="8" gravity="center">
            <button id="btnStart" text="开始" w="58" h="36" textSize="12sp"/>
            <button id="btnPause" text="暂停" w="58" h="36" textSize="12sp" marginLeft="6"/>
        </horizontal>
        <horizontal marginTop="6" gravity="center">
            <button id="btnStop" text="停止" w="58" h="36" textSize="12sp"/>
            <button id="btnExit" text="退出" w="58" h="36" textSize="12sp" marginLeft="6"/>
        </horizontal>
    </vertical>
);

// 窗口初始位置 + 拖动（wx/wy/dragX 等已在外层声明）
win.setPosition(wx, wy);
win.title.setOnTouchListener(function (view, event) {
    switch (event.getAction()) {
        case event.ACTION_DOWN:
            dragX = event.getRawX();
            dragY = event.getRawY();
            baseX = wx;
            baseY = wy;
            return true;
        case event.ACTION_MOVE:
            wx = baseX + (event.getRawX() - dragX);
            wy = baseY + (event.getRawY() - dragY);
            win.setPosition(wx, wy);
            return true;
    }
    return true;
});

// ---------------- 界面刷新 ----------------
function updateStat() {
    try {
        win.stat.setText("成功 " + stats.success + " | 失败 " + stats.fail + " | 跳过 " + stats.skip);
    } catch (e) {}
}
function setStatus(txt) {
    try {
        win.status.setText("状态：" + txt);
    } catch (e) {}
}
// 刷新间隔显示（随机区间）
function updateIntervalUI() {
    try {
        win.intervalMinVal.setText(String(SETTINGS.intervalMin));
        win.intervalMaxVal.setText(String(SETTINGS.intervalMax));
    } catch (e) {}
}

// 取一次随机间隔毫秒数（min ~ max 之间的随机整数秒）
function randomIntervalMs() {
    var lo = Math.min(SETTINGS.intervalMin, SETTINGS.intervalMax);
    var hi = Math.max(SETTINGS.intervalMin, SETTINGS.intervalMax);
    if (hi <= 0) return 0;
    return random(lo, hi) * 1000;
}

// ============================================================
//  二、基础工具函数
// ============================================================

// 可被暂停/停止打断的等待
function isleep(ms) {
    var t = 0;
    while (t < ms) {
        if (RUN.exit || !RUN.active) return false;
        while (RUN.paused && !RUN.exit && RUN.active) sleep(200);
        if (RUN.exit || !RUN.active) return false;
        sleep(100);
        t += 100;
    }
    return true;
}

// 点击控件（优先点击可点击的祖先容器，按坐标点击中心点）
// 关键：若点击点落在悬浮窗范围内，会被悬浮窗拦截（可能误触"开始"等按键），
//       因此自动换一个不在悬浮窗内的点；若整块控件都被遮挡，则改用无障碍点击绕过。
function clickNode(node) {
    if (!node) return false;
    var target = node;
    var cur = node, depth = 0;
    while (cur != null && depth < 6) {
        try { if (cur.clickable()) { target = cur; break; } } catch (e) {}
        cur = cur.parent();
        depth++;
    }
    var b = null;
    try { b = target.bounds(); } catch (e) {}
    if (b && b.width() > 0 && b.height() > 0) {
        var pts = [
            { x: b.centerX(), y: b.centerY() },
            { x: b.left + 8, y: b.centerY() },
            { x: b.right - 8, y: b.centerY() },
            { x: b.centerX(), y: b.top + 8 },
            { x: b.centerX(), y: b.bottom - 8 },
            { x: b.left + 8, y: b.top + 8 },
            { x: b.right - 8, y: b.bottom - 8 }
        ];
        for (var i = 0; i < pts.length; i++) {
            if (!insideWin(pts[i].x, pts[i].y)) {
                return click(pts[i].x, pts[i].y);
            }
        }
        // 所有候选点都被悬浮窗遮挡 -> 用无障碍点击，绕过悬浮窗（不经过触屏）
        try { return target.click(); } catch (e) {}
        return false;
    }
    try { return target.click(); } catch (e) {}
    return false;
}

// 查找详情页左上角的"返回"按钮（点击它比系统返回键更稳妥，不会退出整个合辑）
function findBackButton() {
    var nodes = clickable(true).find();
    var best = null, bestScore = -1;
    var xLimit = device.width * 0.18;
    var yLimit = device.height * 0.16;
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var b = null;
        try { b = n.bounds(); } catch (e) { continue; }
        if (!b) continue;
        if (b.width() <= 0 || b.height() <= 0) continue;
        if (b.left > xLimit || b.top > yLimit) continue;      // 必须位于左上角区域
        if (b.width() > device.width * 0.2) continue;         // 排除整行
        var score = (xLimit - b.left) + (yLimit - b.top);     // 越靠左上越优先
        if (score > bestScore) { bestScore = score; best = n; }
    }
    return best;
}

// 返回合辑页：优先点左上角返回按钮；若已在合辑页则不动；再等待卡片重新出现
function backToCollection() {
    // 最多尝试 3 次返回，每次等待最多 3 秒，确保真的回到合辑页
    for (var attempt = 1; attempt <= 3; attempt++) {
        if (findCards().length > 0) break;
        var btn = findBackButton();
        if (btn) clickNode(btn);   // 优先点左上角返回按钮
        else back();               // 找不到按钮才用系统返回键
        var t = 0;
        while (t < 3000 && RUN.active && !RUN.exit) {
            if (findCards().length > 0) break;
            sleep(300);
            t += 300;
        }
    }
    // 按设置的随机区间等待
    var waitMs = randomIntervalMs();
    if (waitMs > 0) isleep(waitMs);
}

// 找到「关注 / 已关注」按钮
function pickButton(nodes) {
    if (!nodes || nodes.length === 0) return null;
    var best = null, bestArea = 999999999;
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var b = null;
        try { b = n.bounds(); } catch (e) { continue; }
        if (!b) continue;
        if (b.width() <= 0 || b.height() <= 0) continue;
        if (b.top < 0 || b.bottom > device.height) continue;
        var clickableNode = null;
        var cur = n, depth = 0;
        while (cur != null && depth < 6) {
            try { if (cur.clickable()) { clickableNode = cur; break; } } catch (e) {}
            cur = cur.parent();
            depth++;
        }
        if (!clickableNode) continue;
        var area = b.width() * b.height();
        // 按钮面积通常较小，取面积最小的一个，避开大容器
        if (area < bestArea) {
            bestArea = area;
            best = clickableNode;
        }
    }
    return best;
}

// 返回当前页面的关注状态
function getFollowState() {
    // 1) 已关注（优先判断）
    var followed = pickButton(text("已关注").find());
    if (followed) return { state: "followed", node: followed };
    var mutual = pickButton(text("相互关注").find());
    if (mutual) return { state: "followed", node: mutual };
    // 2) 未关注
    var notFollowed = pickButton(text("关注").find());
    if (notFollowed) return { state: "not_followed", node: notFollowed };
    // 3) 都不存在
    return { state: "none", node: null };
}

// 等待详情页加载出关注按钮
function waitDetail() {
    var t = 0;
    while (t < CFG.detailTimeout) {
        if (RUN.exit || !RUN.active) return null;
        var s = getFollowState();
        if (s.state !== "none") return s;
        sleep(300);
        t += 300;
    }
    return null;
}

// ============================================================
//  三、合辑页：作品卡片识别
// ============================================================

// 判断两个控件的中心点是否接近
function sameBounds(a, b) {
    try {
        var ba = a.bounds(), bb = b.bounds();
        var dx = Math.abs(ba.centerX() - bb.centerX());
        var dy = Math.abs(ba.centerY() - bb.centerY());
        return dx < 12 && dy < 12;
    } catch (e) { return false; }
}

// 收集控件内的文本（用于生成卡片签名）
function collectText(node, depth) {
    if (depth > 3) return "";
    var out = "";
    try {
        var t = node.text();
        if (t && String(t).trim() !== "") out += String(t).trim() + "|";
    } catch (e) {}
    try {
        var c = node.childCount();
        for (var i = 0; i < c; i++) {
            out += collectText(node.child(i), depth + 1);
        }
    } catch (e) {}
    return out;
}

// 生成卡片签名（同时使用 描述 + 文本，提升去重可靠性）
function cardSig(node) {
    var parts = [];
    try {
        var d = node.contentDescription();
        if (d && String(d).trim() !== "" && String(d).trim() !== "null") {
            parts.push("d:" + String(d).trim());
        }
    } catch (e) {}
    var txt = collectText(node, 0);
    if (txt && txt !== "") parts.push("t:" + txt);
    if (parts.length === 0) return null;
    return parts.join("|");
}

// 获取当前屏幕内所有"作品卡片"控件（按从上到下、从左到右排序）
function findCards() {
    var all = clickable(true).find();
    var minW = device.width * CFG.cardMinWidthRatio;
    var maxW = device.width * CFG.cardMaxWidthRatio;
    var topLimit = device.height * 0.06;
    var bottomLimit = device.height * 0.96;
    var picked = [];
    for (var i = 0; i < all.length; i++) {
        var n = all[i];
        var b = null;
        try { b = n.bounds(); } catch (e) { continue; }
        if (!b) continue;
        var w = b.width(), h = b.height();
        if (w < minW || w > maxW) continue;      // 过滤过窄(标签)或过宽(整行容器)
        if (h < w * 0.7) continue;               // 卡片大致为竖版
        // 可见高度过滤：只露出一小部分的卡片（多为一屏滑动后残留的上一页笔记）直接跳过
        var visTop = Math.max(b.top, topLimit);
        var visBottom = Math.min(b.bottom, bottomLimit);
        if (visBottom - visTop < h * 0.6) continue;
        picked.push(n);
    }
    // 去重：中心点相近的只保留一个
    var result = [];
    for (var j = 0; j < picked.length; j++) {
        var dup = false;
        for (var k = 0; k < result.length; k++) {
            if (sameBounds(picked[j], result[k])) { dup = true; break; }
        }
        if (!dup) result.push(picked[j]);
    }
    // 排序
    result.sort(function (a, b) {
        var ba = a.bounds(), bb = b.bounds();
        if (Math.abs(ba.top - bb.top) > 20) return ba.top - bb.top;
        return ba.left - bb.left;
    });
    return result;
}

// 判断卡片是否已处理过
function isDone(card) {
    var sig = cardSig(card);
    if (sig && visitedSig[sig]) return true;
    // 同屏按位置带容差匹配（防止页面轻微回弹导致坐标微移后被当成新卡片）
    try {
        var b = card.bounds();
        for (var i = 0; i < visitedScreen.length; i++) {
            if (Math.abs(visitedScreen[i].l - b.left) <= 12 &&
                Math.abs(visitedScreen[i].t - b.top) <= 12) return true;
        }
    } catch (e) {}
    return false;
}

// 标记卡片已处理
function markDone(card) {
    var sig = cardSig(card);
    if (sig) visitedSig[sig] = true;
    try {
        var b = card.bounds();
        visitedScreen.push({ l: b.left, t: b.top });
    } catch (e) {}
}

// ============================================================
//  四、核心流程
// ============================================================

// 点击作品并确认已进入详情页；若仍在合辑页则重试（解决"点击没生效却记为失败"）
// 判定依据：详情页没有合辑网格卡片，findCards() 应为 0
function enterDetail(card) {
    for (var attempt = 1; attempt <= 3; attempt++) {
        clickNode(card);
        // 等待离开合辑页（连续两次检测为空才确认，避免过渡动画瞬间误判）
        var t = 0, zero = 0;
        while (t < CFG.waitCardClick) {
            if (RUN.exit || !RUN.active) return false;
            if (findCards().length === 0) {
                zero++;
                if (zero >= 2) return true;   // 已进入详情页
            } else {
                zero = 0;
            }
            sleep(200);
            t += 200;
        }
        // 仍在合辑页 -> 点击没生效，改用坐标直接重试
        var b = null;
        try { b = card.bounds(); } catch (e) {}
        if (b && b.width() > 0 && b.height() > 0) {
            click(b.centerX(), b.centerY());
            var t2 = 0, zero2 = 0;
            while (t2 < CFG.waitCardClick) {
                if (RUN.exit || !RUN.active) return false;
                if (findCards().length === 0) {
                    zero2++;
                    if (zero2 >= 2) return true;
                } else {
                    zero2 = 0;
                }
                sleep(200);
                t2 += 200;
            }
        }
        if (!isleep(400)) return false;
    }
    return false;   // 多次重试仍没进入详情页
}

// 处理一个作品：进入详情页 -> 判定关注状态 -> 关注/跳过 -> 返回
function handleOneCard(card) {
    // 1. 点击作品封面进入详情页（带校验与重试）
    if (!enterDetail(card)) {
        if (RUN.exit || !RUN.active) return;   // 被停止/退出，不计失败
        // 确实进不去详情页 -> 记失败
        stats.fail++;
        updateStat();
        toast("进入作品失败，已跳过");
        return;
    }

    // 2. 等待详情页的关注按钮
    var s = waitDetail();

    if (s == null) {
        // 没能识别到关注按钮：可能是页面未加载/结构异常 -> 记为失败
        stats.fail++;
        updateStat();
        backToCollection();
        return;
    }

    if (s.state === "followed") {
        // 已经关注过 -> 跳过
        stats.skip++;
        updateStat();
        backToCollection();
        return;
    }

    // 3. 未关注 -> 点击关注
    clickNode(s.node);
    if (!isleep(CFG.waitFollowClick)) return;

    // 4. 验证是否关注成功（按钮变为"已关注"或"相互关注"）
    var ok = false;
    var t = 0;
    while (t < CFG.followVerifyTimeout) {
        if (RUN.exit || !RUN.active) return;
        if (textMatches(/已关注|相互关注/).findOne(200) != null) { ok = true; break; }
        if (text("关注").findOne(200) == null) { ok = true; break; } // "关注"消失也算成功
        sleep(200);
        t += 200;
    }
    if (ok) stats.success++;
    else stats.fail++;
    updateStat();

    // 5. 返回合辑页
    backToCollection();
}

// 确保当前处于合辑页（有作品卡片）
function ensureCollectionPage() {
    for (var i = 0; i < 4; i++) {
        if (findCards().length > 0) return true;
        back();
        if (!isleep(CFG.waitBack)) return false;
    }
    return false;
}

// 等待屏幕出现作品卡片（超时返回 0，否则返回卡片数量）
function waitCards(timeout) {
    var t = 0;
    while (t < timeout) {
        if (RUN.exit || !RUN.active) return 0;
        if (findCards().length > 0) return findCards().length;
        sleep(300);
        t += 300;
    }
    return 0;
}

// 一次完整遍历：从当前屏幕开始，逐个处理并下滑，直到合辑到底
function runOneRound() {
    visitedScreen = [];
    var idleSwipe = 0;
    var noMoveCount = 0;     // 连续"滑动后页面毫无位移"的次数
    var stopReason = "";

    setStatus("运行中");

    while (RUN.active && !RUN.exit) {
        // 暂停处理
        while (RUN.paused && RUN.active && !RUN.exit) sleep(200);
        if (!RUN.active || RUN.exit) break;

        var cards = findCards();
        if (cards.length === 0) {
            // 页面可能正在加载，先动态等待；仍无卡片再滑动
            if (waitCards(1500) === 0) {
                if (!swipeUp()) { stopReason = "无法滑动"; break; }
                refreshWinSize();
                if (waitCards(4000) === 0) {
                    idleSwipe++;
                    if (idleSwipe >= CFG.maxIdleSwipe) {
                        stopReason = "页面无卡片";
                        break;
                    }
                } else {
                    idleSwipe = 0;
                }
                if (!isleep(500)) break;   // 等页面动画/懒加载沉降，避免拿到过渡态节点
                visitedScreen = [];        // 换屏，重置同屏去重
            }
            continue;
        }

        // 找当前屏幕中第一个未处理的卡片
        var target = null;
        for (var i = 0; i < cards.length; i++) {
            if (!isDone(cards[i])) {
                target = cards[i];
                break;
            }
        }

        if (target == null) {
            // 当前屏幕的卡片都处理完了 -> 下滑加载更多（动态等待，不固定死等）
            var beforeSig = screenSignature(cards);
            if (!swipeUp()) { stopReason = "无法滑动"; break; }
            var got = waitCards(4000);
            refreshWinSize();
            if (!isleep(500)) break;   // 等页面动画/懒加载沉降，避免拿到过渡态节点
            var curCards = findCards();
            var afterSig = screenSignature(curCards);

            // ① 页面完全没有位移 => 已经滑到最后一页，直接结束，绝不再重复处理
            if (curCards.length > 0 && cardsNotMoved(cards, curCards)) {
                noMoveCount++;
                if (noMoveCount >= 2) { stopReason = "已到最后一页"; break; }
                continue;
            }
            noMoveCount = 0;

            // ② 滑动后仍无卡片、或内容与上一屏完全相同 => 未加载出新内容
            //    此时不清空同屏去重记录，避免把同一页卡片当成新作品反复处理
            if (got === 0 || curCards.length === 0 || afterSig === beforeSig) {
                idleSwipe++;
                if (idleSwipe >= CFG.maxIdleSwipe) {
                    stopReason = "连续" + CFG.maxIdleSwipe + "次滑动无新内容";
                    break;
                }
                continue;
            }

            // ③ 确认出现了新内容，才清空同屏去重，继续处理下一屏
            idleSwipe = 0;
            visitedScreen = [];
            continue;
        }

        // 标记并处理
        markDone(target);
        handleOneCard(target);
    }

    // 结束
    setStatus("已完成");
    toast("合辑处理完成：成功 " + stats.success + " / 失败 " + stats.fail + " / 跳过 " + stats.skip
          + (stopReason ? "（" + stopReason + "）" : ""));
}

// 计算当前屏幕卡片的整体签名（用于判断是否滑动出新内容）
function screenSignature(cards) {
    var s = "";
    for (var i = 0; i < cards.length; i++) {
        var sig = cardSig(cards[i]);
        if (sig) s += sig + "#";
        else {
            // 无签名时用坐标兜底；坐标取整到 10px，避免回弹/像素抖动造成"看似变化"
            try {
                var b = cards[i].bounds();
                s += "x" + Math.round(b.left / 10) + "," + Math.round(b.top / 10) + "#";
            } catch (e) {}
        }
    }
    return s;
}

// 滑动前后卡片位置是否基本没变（说明已经滑到底，页面不再滚动）
// 允许数量相差 1：边缘卡片可能因"可见高度不足60%"过滤而增减
function cardsNotMoved(a, b) {
    if (a.length === 0 || b.length === 0) return false;
    if (Math.abs(a.length - b.length) > 1) return false;
    var matched = 0;
    for (var i = 0; i < a.length; i++) {
        var ba = null;
        try { ba = a[i].bounds(); } catch (e) { continue; }
        if (!ba) continue;
        var sa = cardSig(a[i]);
        for (var j = 0; j < b.length; j++) {
            var bb = null;
            try { bb = b[j].bounds(); } catch (e) { continue; }
            if (bb && Math.abs(ba.left - bb.left) <= 8 && Math.abs(ba.top - bb.top) <= 8) {
                // 位置相同但内容不同 => 是滚动后的新一排，不算"没变化"
                var sb = cardSig(b[j]);
                if ((sa === null) !== (sb === null)) return false;
                if (sa !== null && sa !== sb) return false;
                matched++;
                break;
            }
        }
    }
    return matched >= Math.max(1, Math.min(a.length, b.length) - 1);
}

// 上滑一屏
function swipeUp() {
    var y1 = device.height * CFG.swipeStartY;
    var y2 = device.height * CFG.swipeEndY;
    var midY = (y1 + y2) / 2;
    // 选一个不被悬浮窗挡住的横坐标，否则滑动手势会被悬浮窗拦截而"滑不动"
    var xs = [device.width * 0.5, device.width * 0.35, device.width * 0.65, device.width * 0.2];
    for (var i = 0; i < xs.length; i++) {
        if (!insideWin(xs[i], y1) && !insideWin(xs[i], midY) && !insideWin(xs[i], y2)) {
            return swipe(xs[i], y1, xs[i], y2, CFG.swipeDuration);
        }
    }
    return swipe(device.width * 0.5, y1, device.width * 0.5, y2, CFG.swipeDuration);
}

// ============================================================
//  五、悬浮窗事件绑定
// ============================================================

win.btnStart.on("click", function () {
    if (RUN.active) { toast("正在运行中"); return; }   // 防误触：运行中再点"开始"不重置
    // 重置统计与去重记录
    stats.success = 0;
    stats.fail = 0;
    stats.skip = 0;
    visitedSig = {};
    visitedScreen = [];
    refreshWinSize();
    updateStat();
    RUN.active = true;
    RUN.paused = false;
    setStatus("运行中");
    toast("开始运行，请确保当前停留在合辑页面");
});

win.btnPause.on("click", function () {
    if (!RUN.active) {
        toast("尚未开始");
        return;
    }
    if (RUN.paused) {
        RUN.paused = false;
        setStatus("运行中");
        win.btnPause.setText("暂停");
    } else {
        RUN.paused = true;
        setStatus("已暂停");
        win.btnPause.setText("继续");
    }
});

win.btnStop.on("click", function () {
    RUN.active = false;
    RUN.paused = false;
    win.btnPause.setText("暂停");
    setStatus("已停止");
    toast("已停止");
});

win.btnExit.on("click", function () {
    RUN.exit = true;
    RUN.active = false;
    setStatus("退出中");
    try { win.close(); } catch (e) {}
    toast("脚本已退出");
    exit();
});

// ---------------- 间隔区间设置（最小 ~ 最大，范围 0 ~ 120 秒，最小不超过最大） ----------------
win.btnMinMinus.on("click", function () {
    if (SETTINGS.intervalMin > 0) {
        SETTINGS.intervalMin--;
        updateIntervalUI();
    }
});
win.btnMinPlus.on("click", function () {
    if (SETTINGS.intervalMin < SETTINGS.intervalMax) {
        SETTINGS.intervalMin++;
        updateIntervalUI();
    }
});
win.btnMaxMinus.on("click", function () {
    if (SETTINGS.intervalMax > SETTINGS.intervalMin) {
        SETTINGS.intervalMax--;
        updateIntervalUI();
    }
});
win.btnMaxPlus.on("click", function () {
    if (SETTINGS.intervalMax < 120) {
        SETTINGS.intervalMax++;
        updateIntervalUI();
    }
});

// ============================================================
//  六、启动工作线程
// ============================================================

updateStat();
setStatus("待机");
updateIntervalUI();

// 稍后读取悬浮窗真实尺寸（用于点击时避让，防止误触按键）
threads.start(function () {
    sleep(1000);
    refreshWinSize();
});

threads.start(function () {
    while (!RUN.exit) {
        if (!RUN.active) {
            sleep(200);
            continue;
        }
        // 进入一次完整遍历（内部支持暂停/停止）
        runOneRound();
        RUN.active = false;
        win.btnPause.setText("暂停");
    }
});

}   // ===== startAutomation() 结束 =====
