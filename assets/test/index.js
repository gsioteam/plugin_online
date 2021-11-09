class IndexController extends Controller {
    load() {
        this.data = {
            tabs: [
                {
                    "title": "Drama List",
                    "id": "drama-list",
                    "url": "https://dramacool.bz/drama-list.html?page={0}"
                }, 
                {
                    "title": "TV Series",
                    "id": "series",
                    "url": "https://dramacool.bz/series.html?page={0}"
                }, 
                {
                    "title": "Movies",
                    "id": "movies",
                    "url": "https://dramacool.bz/movies.html?page={0}"
                }, 
                {
                    "title": "Kshows",
                    "id": "kshows",
                    "url": "https://dramacool.bz/kshows.html?page={0}"
                }
            ]
        };
    }
}

module.exports = IndexController;