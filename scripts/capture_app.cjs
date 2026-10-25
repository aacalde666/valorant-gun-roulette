const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      offscreen: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const distPath = path.join(__dirname, '..', 'dist', 'index.html');
  await win.loadFile(distPath);

  // Wait 1.5s for fonts & SVGs to render
  setTimeout(async () => {
    // 1. App Dashboard
    const imgDash = await win.capturePage();
    const outDash = path.join(__dirname, '..', 'docs', 'images', 'app_dashboard.png');
    fs.writeFileSync(outDash, imgDash.toPNG());
    console.log('App dashboard captured at:', outDash);

    // 2. Trigger In-Game HUD Toast
    await win.webContents.executeJavaScript(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Probar Toast'));
      if (btn) btn.click();
    `);

    setTimeout(async () => {
      const imgToast = await win.capturePage();
      const outToast = path.join(__dirname, '..', 'docs', 'images', 'app_ingame_hud.png');
      fs.writeFileSync(outToast, imgToast.toPNG());
      console.log('App HUD Toast captured at:', outToast);

      // 3. Scroll to Arsenal Board
      await win.webContents.executeJavaScript('window.scrollTo(0, 750);');
      setTimeout(async () => {
        const imgArsenal = await win.capturePage();
        const outArsenal = path.join(__dirname, '..', 'docs', 'images', 'app_arsenal_board.png');
        fs.writeFileSync(outArsenal, imgArsenal.toPNG());
        console.log('App Arsenal Board captured at:', outArsenal);
        app.quit();
      }, 500);
    }, 400);
  }, 1500);
});
