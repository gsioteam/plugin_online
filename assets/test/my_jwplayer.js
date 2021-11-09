
window.jwplayer = function() {
    return {
        setup(data) {
            messenger.send('message', {
                event: 'complete',
                data: data
            });
        }
    };
}