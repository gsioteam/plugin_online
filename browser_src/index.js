
const http = require('isomorphic-git/http/web');
const git = require('isomorphic-git')
const BrowserFS = require('browserfs');
const md5 = require('md5');
const path = require('path');

class POManager {
    constructor() {
        BrowserFS.install(window);
    }

    async _loadFiles(fs, dir, root) {
        if (!root) root = dir;
        let files = fs.readdirSync(dir);
        let res = [];
        for (let file of files) {
            if (file[0] == '.') continue;
            let filepath = path.join(dir, file);

            let stats = fs.statSync(filepath);
            if (stats.isDirectory()) {
                let lst = await this._loadFiles(fs, filepath, root);
                for (let key of lst) {
                    res.push(new FileItem(key, lst[key]));
                }
            } else {
                res.push(
                    new FileItem(filepath.replace(new RegExp('^' + dir + (dir[dir.length - 1] != '/' ? '/' : '')), ''), 
                    fs.readFileSync(filepath)));
            }
        }
        return res;
    }

    clone(src) {
        return new Promise((resolve, reject) => {
            BrowserFS.FileSystem.LocalStorage.Create(async (e, lsfs) => {
                if (e) {
                    reject(e);
                } else {
                    BrowserFS.initialize(lsfs);

                    const fs = BrowserFS.BFSRequire('fs');
                    let dir = '/' + md5(src);
                    await git.clone({ 
                        fs, 
                        http, 
                        dir, 
                        url: src, 
                        corsProxy: 'https://cors.isomorphic-git.org',
                    });
            
                    resolve(await this._loadFiles(fs, dir));
                }
            });
        });
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => {
                let arraybuffer = reader.result;
                const Buffer = BrowserFS.BFSRequire('buffer').Buffer;
                BrowserFS.FileSystem.ZipFS.Create({
                    zipData: Buffer.from(arraybuffer),
                }, async (e, zfs) => {
                    if (e) {
                        reject(e);
                    } else {
                        BrowserFS.initialize(zfs);
                        const fs = BrowserFS.BFSRequire('fs');
                        resolve(await this._loadFiles(fs, '/'));
                    }
                });
            }
            reader.onerror = function (event) {
                reject(event.error);
            }
            reader.readAsArrayBuffer(file);
        });
    }
}

class FileItem {
    constructor(src, buffer) {
        this.path = src;
        this.buffer = buffer;
        this.ext = path.extname(src);
    }

    get element() {
        if (!this._element) {
            this._element = document.createElement('div');
            this._element.className = 'file-item';
            this._element.innerText = this.path;
            this._element.title = this.path;
            this._element.onclick = () => {
                if (this.onclick) {
                    this.onclick();
                }
            }
        }
        return this._element;
    }

    toJSON() {
        return {
            path: this.path,
            buffer: this.buffer,
        };
    }

    get text() {
        return this.buffer.toString('utf-8');
    }
}

window.manager = new POManager();

