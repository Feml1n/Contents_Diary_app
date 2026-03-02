document.addEventListener("DOMContentLoaded", function () {
    const review = document.getElementById("review");
    const charCount = document.getElementById("charCount");

    review.addEventListener("input", function () {
        charCount.innerText = review.value.length + " / 300";
    });
});


let data = JSON.parse(localStorage.getItem("contents") || "[]");

function saveData() {
    localStorage.setItem("contents", JSON.stringify(data));
}

function show(id) {
    document.querySelectorAll("#app > div")
        .forEach(d => d.classList.add("hidden"));

    document.getElementById(id)
        .classList.remove("hidden");

    if (id === "home") renderHome();
    if (id === "stats") renderStats();
    if (id === "genres") {
        document.getElementById("genreContent").innerHTML =
            `<p style="color:var(--text-muted); margin-top:20px;">ジャンルを選択してください。</p>`;
    }
}

function showStatus(status) {
    show("list");
    document.getElementById("listTitle").innerText = status + "一覧";

    let list = data
        .filter(d => (d.status || "積み") === status)
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    document.getElementById("listContent").innerHTML =
        list.map(d => card(d)).join("");
}

function showGenreList(genre) {
    let list = data
        .filter(d => (d.genre || "-") === genre)
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    let html = list.map(d => card(d)).join("");
    if (!html) {
        html = `<p style="color:var(--text-muted); margin-top:20px;">このジャンルの記録はありません。</p>`;
    }
    document.getElementById("genreContent").innerHTML = html;
}

function card(d) {

    const genre = d.genre || "-";
    const status = d.status || "-";

    return `<div class="card">
    <b>${d.title}</b><br>
    ${genre} | ${status}<br>
    金額: ${d.price || 0}円<br>
    評価: ${d.rating || "-"}<br>
    ${d.review ? "<hr>" + d.review : ""}
  </div>`;
}



function toggleRating() {
    let status = document.getElementById("status").value;
    document.getElementById("ratingBox").classList.toggle(
        "hidden", !(status === "消費中" || status === "消費済")
    );
}

function save() {

    const titleEl = document.getElementById("title");
    const genreEl = document.getElementById("genre");
    const priceEl = document.getElementById("price");
    const statusEl = document.getElementById("status");
    const ratingEl = document.getElementById("rating");
    const reviewEl = document.getElementById("review");
    const dateEl = document.getElementById("date");

    let item = {
        title: titleEl.value,
        genre: genreEl.value,      // ← 明示的にvalueを取得
        price: Number(priceEl.value),
        status: statusEl.value,
        rating: ratingEl.value,
        review: reviewEl.value,
        date: dateEl.value,
        created: new Date().toISOString()
    };

    if (!item.title) { alert("タイトル必須"); return; }
    if (item.review.length > 300) { alert("レビューは300文字以内"); return; }

    data.push(item);
    saveData();
    alert("保存しました");
    location.reload();
}


function renderHome() {
    let sorted = [...data].sort((a, b) => new Date(b.created) - new Date(a.created));

    document.getElementById("recent").innerHTML =
        sorted.slice(0, 5).map(d => card(d)).join("");

    let wish = sorted.filter(d => d.status === "気になる").slice(0, 5);
    document.getElementById("wishlistPreview").innerHTML =
        wish.map(d => card(d)).join("");

    let total = data.reduce((sum, d) => sum + (d.price || 0), 0);
    document.getElementById("summary").innerText =
        "総登録数: " + data.length + "件 / 総消費金額: " + total + "円";
}

function renderStats() {
    let counts = { 積み: 0, 消費中: 0, 消費済: 0, 気になる: 0 };

    data.forEach(d => {
        let s = d.status || "積み";
        if (counts[s] !== undefined) {
            counts[s]++;
        }
    });

    // --- Genre counts ---
    let genreCounts = {};
    data.forEach(d => {
        let g = d.genre || "その他";
        genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    const canvas = document.getElementById("chart");
    const dpr = window.devicePixelRatio || 1;
    const displayW = 500;
    const displayH = 340;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayW, displayH);

    // ===== Status Bar Chart =====
    const statusColors = {
        "積み": "#111111",
        "消費中": "#555555",
        "消費済": "#999999",
        "気になる": "#cccccc"
    };
    const keys = Object.keys(counts);
    const maxCount = Math.max(...Object.values(counts), 1);
    const barAreaX = 90;
    const barMaxW = displayW - barAreaX - 40;
    const barH = 28;
    const barGap = 16;
    const startY = 35;

    // Title
    ctx.fillStyle = "#111";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText("ステータス別", 10, 20);

    // Gridlines
    const gridSteps = 5;
    ctx.strokeStyle = "#e8e8e8";
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSteps; i++) {
        let x = barAreaX + (barMaxW / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(x, startY - 5);
        ctx.lineTo(x, startY + keys.length * (barH + barGap));
        ctx.stroke();
    }

    keys.forEach((k, i) => {
        let y = startY + i * (barH + barGap);
        let w = maxCount > 0 ? (counts[k] / maxCount) * barMaxW : 0;

        // Label
        ctx.fillStyle = "#333";
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        ctx.fillText(k, barAreaX - 10, y + barH / 2);

        // Bar with rounded corners
        ctx.fillStyle = statusColors[k] || "#888";
        if (w > 0) {
            let r = Math.min(6, w / 2);
            ctx.beginPath();
            ctx.moveTo(barAreaX + r, y);
            ctx.lineTo(barAreaX + w - r, y);
            ctx.quadraticCurveTo(barAreaX + w, y, barAreaX + w, y + r);
            ctx.lineTo(barAreaX + w, y + barH - r);
            ctx.quadraticCurveTo(barAreaX + w, y + barH, barAreaX + w - r, y + barH);
            ctx.lineTo(barAreaX + r, y + barH);
            ctx.quadraticCurveTo(barAreaX, y + barH, barAreaX, y + barH - r);
            ctx.lineTo(barAreaX, y + r);
            ctx.quadraticCurveTo(barAreaX, y, barAreaX + r, y);
            ctx.closePath();
            ctx.fill();
        }

        // Value label
        ctx.fillStyle = "#111";
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(counts[k] + "件", barAreaX + w + 8, y + barH / 2);
    });

    // ===== Genre Donut Chart =====
    const donutY = startY + keys.length * (barH + barGap) + 40;
    ctx.fillStyle = "#111";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ジャンル別", 10, donutY);

    const genreColors = ["#111", "#333", "#555", "#777", "#999", "#bbb", "#ddd"];
    const genreKeys = Object.keys(genreCounts);
    const totalGenre = genreKeys.reduce((s, k) => s + genreCounts[k], 0);

    if (totalGenre > 0) {
        const cx = 80;
        const cy = donutY + 70;
        const outerR = 50;
        const innerR = 28;
        let angle = -Math.PI / 2;

        genreKeys.forEach((k, i) => {
            let slice = (genreCounts[k] / totalGenre) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, angle, angle + slice);
            ctx.arc(cx, cy, innerR, angle + slice, angle, true);
            ctx.closePath();
            ctx.fillStyle = genreColors[i % genreColors.length];
            ctx.fill();
            angle += slice;
        });

        // Center text
        ctx.fillStyle = "#111";
        ctx.font = "bold 16px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(totalGenre, cx, cy - 6);
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText("件", cx, cy + 10);

        // Legend
        const legendX = 160;
        genreKeys.forEach((k, i) => {
            let ly = donutY + 25 + i * 22;
            ctx.fillStyle = genreColors[i % genreColors.length];
            ctx.beginPath();
            ctx.arc(legendX, ly, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#333";
            ctx.font = "13px 'Inter', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(k + "  " + genreCounts[k] + "件", legendX + 14, ly);
        });
    } else {
        ctx.fillStyle = "#999";
        ctx.font = "13px 'Inter', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("データがありません", 10, donutY + 30);
    }

    let total = data.reduce((sum, d) => sum + (d.price || 0), 0);
    document.getElementById("totalMoney").innerText =
        "総消費金額: " + total.toLocaleString() + "円";

    renderHeatmap();
}

// ============== 毎日の消費ヒートマップ ==============
let heatmapYear = new Date().getFullYear();

function changeHeatmapYear(delta) {
    heatmapYear += delta;
    renderHeatmap();
}

function renderHeatmap() {
    document.getElementById("heatmapYearLabel").innerText = heatmapYear + "年";

    // Count entries per date for the selected year
    const dateCounts = {};
    data.forEach(d => {
        const dateStr = d.date || (d.created ? d.created.slice(0, 10) : "");
        if (dateStr && dateStr.startsWith(String(heatmapYear))) {
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        }
    });

    const maxCount = Math.max(...Object.values(dateCounts), 1);

    // Calculate weeks in the year (needed for sizing)
    const jan1 = new Date(heatmapYear, 0, 1);
    const dec31 = new Date(heatmapYear, 11, 31);
    const startDay = jan1.getDay();
    const totalDays = Math.round((dec31 - jan1) / 86400000) + 1;
    const totalWeeks = Math.ceil((totalDays + startDay) / 7);

    // Responsive cell sizing based on container width
    const container = document.getElementById("heatmap").parentElement;
    const availableW = Math.min(container.clientWidth - 20, 960);
    const labelW = Math.max(28, Math.min(36, availableW * 0.05));
    const idealCellSize = Math.floor((availableW - labelW - 10) / totalWeeks - 3);
    const cellSize = Math.max(8, Math.min(14, idealCellSize));
    const cellGap = Math.max(2, Math.min(3, Math.floor(cellSize * 0.2)));
    const step = cellSize + cellGap;
    const topPad = cellSize >= 12 ? 28 : 20;
    const bottomPad = 40;

    const canvasW = labelW + totalWeeks * step + 10;
    const canvasH = topPad + 7 * step + bottomPad;

    const canvas = document.getElementById("heatmap");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + "px";
    canvas.style.height = canvasH + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Dynamic font size based on cell size
    const fontSize = Math.max(9, Math.min(11, cellSize - 2));

    // Day-of-week labels
    const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
    ctx.fillStyle = "#999";
    ctx.font = fontSize + "px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 7; i++) {
        if (i % 2 === 1) { // show Mon, Wed, Fri
            ctx.fillText(dayLabels[i], labelW - 6, topPad + i * step + cellSize / 2);
        }
    }

    // Month labels
    ctx.fillStyle = "#666";
    ctx.font = fontSize + "px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    let lastMonthDrawn = -1;

    // Store cell positions for tooltip
    const cellPositions = [];

    // Draw cells
    const curDate = new Date(jan1);
    for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
        const col = Math.floor((dayIdx + startDay) / 7);
        const row = (dayIdx + startDay) % 7;
        const x = labelW + col * step;
        const y = topPad + row * step;

        const month = curDate.getMonth();
        const dateKey = curDate.getFullYear() + "-" +
            String(month + 1).padStart(2, "0") + "-" +
            String(curDate.getDate()).padStart(2, "0");

        // Month label (draw at the first week of each month)
        if (month !== lastMonthDrawn && row <= 3) {
            ctx.fillStyle = "#666";
            ctx.font = fontSize + "px 'Inter', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(monthNames[month], x, 6);
            lastMonthDrawn = month;
        }

        const count = dateCounts[dateKey] || 0;

        // Color: empty = light gray, filled = gradient from light to black
        let fillColor;
        if (count === 0) {
            fillColor = "#ebedf0";
        } else {
            const intensity = Math.min(count / maxCount, 1);
            if (intensity <= 0.25) fillColor = "#c6c6c6";
            else if (intensity <= 0.5) fillColor = "#888888";
            else if (intensity <= 0.75) fillColor = "#444444";
            else fillColor = "#111111";
        }

        // Draw rounded rect
        const r = 2;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + cellSize - r, y);
        ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + r);
        ctx.lineTo(x + cellSize, y + cellSize - r);
        ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - r, y + cellSize);
        ctx.lineTo(x + r, y + cellSize);
        ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        cellPositions.push({ x, y, w: cellSize, h: cellSize, date: dateKey, count });

        curDate.setDate(curDate.getDate() + 1);
    }

    // Legend
    const legendY = topPad + 7 * step + 12;
    ctx.fillStyle = "#999";
    ctx.font = fontSize + "px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Less", labelW, legendY + cellSize / 2);

    const legendColors = ["#ebedf0", "#c6c6c6", "#888888", "#444444", "#111111"];
    const legendStartX = labelW + 34;
    legendColors.forEach((c, i) => {
        ctx.fillStyle = c;
        const lx = legendStartX + i * (cellSize + 3);
        ctx.beginPath();
        ctx.moveTo(lx + 2, legendY);
        ctx.lineTo(lx + cellSize - 2, legendY);
        ctx.quadraticCurveTo(lx + cellSize, legendY, lx + cellSize, legendY + 2);
        ctx.lineTo(lx + cellSize, legendY + cellSize - 2);
        ctx.quadraticCurveTo(lx + cellSize, legendY + cellSize, lx + cellSize - 2, legendY + cellSize);
        ctx.lineTo(lx + 2, legendY + cellSize);
        ctx.quadraticCurveTo(lx, legendY + cellSize, lx, legendY + cellSize - 2);
        ctx.lineTo(lx, legendY + 2);
        ctx.quadraticCurveTo(lx, legendY, lx + 2, legendY);
        ctx.closePath();
        ctx.fill();
    });

    ctx.fillStyle = "#999";
    ctx.fillText("More", legendStartX + legendColors.length * (cellSize + 3) + 4, legendY + cellSize / 2);

    // Total count for this year
    const yearTotal = Object.values(dateCounts).reduce((s, v) => s + v, 0);
    ctx.fillStyle = "#333";
    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(yearTotal + "件の記録（" + heatmapYear + "年）",
        canvasW - 10, legendY + cellSize / 2);

    // Tooltip on hover
    const tooltip = document.getElementById("heatmapTooltip");
    canvas.onmousemove = function (e) {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left);
        const my = (e.clientY - rect.top);
        let found = false;
        for (const cell of cellPositions) {
            if (mx >= cell.x && mx <= cell.x + cell.w &&
                my >= cell.y && my <= cell.y + cell.h) {
                tooltip.style.display = "block";
                tooltip.style.left = (e.clientX + 12) + "px";
                tooltip.style.top = (e.clientY - 30) + "px";
                tooltip.innerText = cell.date + "：" + cell.count + "件";
                found = true;
                break;
            }
        }
        if (!found) tooltip.style.display = "none";
    };
    canvas.onmouseleave = function () {
        tooltip.style.display = "none";
    };
}

// ============== データのエクスポート（ファイル保存） ==============
function exportData() {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contents_backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============== データのインポート（ファイル読込） ==============
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (!confirm("現在のデータは上書きされます。本当によろしいですか？")) {
                    document.getElementById('importFile').value = ''; // リセット
                    return;
                }
                data = importedData;
                saveData();
                alert("データを復元しました。");
                location.reload();
            } else {
                alert("無効なデータ形式です。正しいバックアップファイルを選択してください。");
            }
        } catch (error) {
            alert("ファイルの読み込みに失敗しました: " + error.message);
        }
    };
    reader.readAsText(file);
}

renderHome();
