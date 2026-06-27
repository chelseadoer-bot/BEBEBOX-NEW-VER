/* 베베박스 2.0 — 의존성 없는 정적 파일 서버 (Render 웹 서비스용)
   Node 내장 모듈만 사용. PORT 환경변수 사용(기본 8090). */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8090;
const TYPES = {
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
  ".webp":"image/webp", ".gif":"image/gif", ".ico":"image/x-icon", ".txt":"text/plain; charset=utf-8",
  ".woff":"font/woff", ".woff2":"font/woff2", ".map":"application/json; charset=utf-8",
};

http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    // 경로 이탈 방지
    const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(ROOT, safe);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // 확장자 없는 경로는 index.html로 폴백(SPA 친화)
        if (!path.extname(filePath)) {
          filePath = path.join(ROOT, "index.html");
        } else {
          res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
          return res.end("404 Not Found");
        }
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {"Content-Type": TYPES[ext] || "application/octet-stream"});
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end("Server error");
  }
}).listen(PORT, () => console.log("bebebox-next static server on :" + PORT));
