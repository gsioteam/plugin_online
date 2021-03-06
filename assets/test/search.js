
const baseURL = 'https://dramacool.bz/search/?name={0}&page={1}';

class SearchController extends Controller {

    load() {
        let str = localStorage['hints'];
        let hints = [];
        if (str) {
            let json = JSON.parse(str);
            if (json.push) {
                hints = json;
            }
        }
        this.data = {
            list: [],
            focus: false,
            hints: hints,
            text: '',
            loading: false,
            hasMore: true,
        };
        this.hasMore = true;
    }

    makeURL(word, page) {
        return baseURL.replace('{0}', encodeURIComponent(word)).replace('{1}', page + 1);
    }

    onSearchClicked() {
        this.findElement('input').submit();
    } 

    onTextChange(text) {
        this.data.text = text;
    }

    async onTextSubmit(text) {
        let hints = this.data.hints;
        if (text.length > 0) {
            if (hints.indexOf(text) < 0) {
                this.setState(()=>{
                    hints.unshift(text);
                    while (hints.length > 30) {
                        hints.pop();
                    }
    
                    localStorage['hints'] = JSON.stringify(hints);
                });
            }
            
            this.setState(()=>{
                this.data.loading = true;
            });
            try {
                let list = await this.request(this.makeURL(text, 0));
                this.key = text;
                this.page = 0;
                this.hasMore = true;
                this.setState(()=>{
                    this.data.list = list;
                    this.data.loading = false;
                });
            } catch(e) {
                showToast(`${e}\n${e.stack}`);
                this.setState(()=>{
                    this.data.loading = false;
                });
            }
        }
    }

    onTextFocus() {
        this.setState(()=>{
            this.data.focus = true;
        });
    }

    onTextBlur() {
        this.setState(()=>{
            this.data.focus = false;
        });
    }

    onPressed(index) {
        var data = this.data.list[index];
        openVideo(data.link, data);
    }

    onHintPressed(index) {
        let hint = this.data.hints[index];
        if (hint) {
            this.setState(()=>{
                this.data.text = hint;
                this.findElement('input').blur();
                this.onTextSubmit(hint);
            });
        }
    }

    async onRefresh() {
        let text = this.key;
        if (!text) return;
        try {
            let list = await this.request(this.makeURL(text, 0));
            this.page = 0;
            this.hasMore = true;
            this.setState(()=>{
                this.data.list = list;
                this.data.loading = false;
            });
        } catch(e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    async onLoadMore() {
        if (!this.hasMore) return;
        let page = this.page + 1;
        try {
            let list = await this.request(this.makeURL(text, page));
            if (list.length == 0) {
                this.hasMore = false;
            }
            this.page = page;
            this.setState(()=>{
                for (let item in list) {
                    this.data.list.push(item);
                }
                this.data.loading = false;
            });
        } catch(e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    async request(url) {
        let res = await fetch(url);
        let html = await res.text();
        let doc = HTMLParser.parse(html);
        let nodes = doc.querySelectorAll('.list-episode-item > li');

        let items = [];
        for (let node of nodes) {
            let img = node.querySelector('img');

            items.push({
                title: node.querySelector('.title').text,
                subtitle: `[${node.querySelector('.type').text}] ${node.querySelector('.ep').text}`,
                link: new URL(node.querySelector('a').getAttribute('href'), url).toString(),
                picture: img.getAttribute('src') || img.getAttribute('data-src'),
                pictureHeaders: {
                    Referer: 'https://dramacool.bz/'
                },
            });
        }
        return items;
    }
}

module.exports = SearchController;