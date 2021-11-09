

class VideoProcesser extends Processor {
    async load(data) {
        let url = data.link;
        this.value = {
            title: data.title,
            subtitle: data.subtitle,
            link: url,
        };
        let res = await fetch(url);
        let text = await res.text();
        let doc = HTMLParser.parse(text);
        
        let description = doc.querySelector('.desc').text;
        let episodes = doc.querySelectorAll('.list-episode-item-2 > li');
        let items = [];
        for (let i = 0, t = episodes.length; i < t; ++i) {
            let episode = episodes[t - i - 1];
            items.push({
                title: episode.querySelector('.title').text,
                subtitle: episode.querySelector('.type').text,
                key: new URL(episode.querySelector('a').getAttribute('href'), url).toString(),
            });
        }

        this.value = {
            description: description,
            items: items,
        };
    }

    async getVideo(key, data) {
        var cache = localStorage[`video:${key}`];
        if (cache) {
            return JSON.parse(cache);
        }

        let url = key;
        let res = await fetch(url);
        let doc = HTMLParser.parse(await res.text());

        let src = doc.querySelector('.watch-iframe > iframe').getAttribute('src');

        let items = await this.loadVideoUrl(src);

        console.log(`Result: ${JSON.stringify(items)}`);
        if (items != null && items.length > 0)
            localStorage[`video:${key}`] = JSON.stringify(items);
        return items;
    }

    loadVideoUrl(src) {
        return new Promise((resolve, reject) => {
            let webView = new HiddenWebView({
                resourceReplacements: [{
                    test:'jwplayer\.js',
                    resource: this.loadString('my_jwplayer.js'),
                    mimeType: 'text/javascript',
                }]
            });
            let cleanUp = () => {
                this.webView = null;
            }; 
            webView.load(src);
            webView.onmessage = (ev) => {
                let event = ev.event;
                let data = ev.data;
                switch (event) {
                    case 'complete': {
                        let items = [];
                        for (let source of data.sources) {
                            items.push({
                                title: source.label,
                                url: source.file
                            });
                        }
                        resolve(items);
                        cleanUp();
                        break;
                    }
                }
            };
            this.webView = webView;
        });

    }

    async getResolution(data) {

    }

    clearVideoCache(key) {
        localStorage.removeItem(`video:${key}`);
    }
}

module.exports = VideoProcesser;