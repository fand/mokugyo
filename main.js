if (typeof webkitAudioContext !== 'undefined') {
    window.ctx = new webkitAudioContext();
}
else if (typeof AudioContext !== 'undefined') {
    window.ctx = new AudioContext();
}

window.KYO = [
    '観自在菩薩', '行深般若波羅蜜多時', '照見五蘊皆空',
    '度一切苦厄', '舎利子', '色不異空', '空不異色', '色即是空',
    '空即是色', '受想行識亦復如是', '舎利子', '是諸法空相',
    '不生不滅', '不垢不浄', '不増不減', '是故空中',
    '無色', '無受想行識', '無眼耳鼻舌身意', '無色声香味触法',
    '無眼界', '乃至無意識界', '無無明亦', '無無明尽',
    '乃至無老死', '亦無老死尽', '無苦集滅道', '無智亦無得',
    '以無所得故', '菩提薩埵', '依般若波羅蜜多故',
    '心無罣礙', '無罣礙故', '無有恐怖', '遠離一切顛倒夢想',
    '究竟涅槃', '三世諸仏', '依般若波羅蜜多故',
    '得阿耨多羅三藐三菩提', '故知般若波羅蜜多',
    '是大神呪', '是大明呪', '是無上呪', '是無等等呪',
    '能除一切苦', '真実不虚', '故説般若波羅蜜多呪',
    '即説呪日', '羯諦', '羯諦', '波羅羯諦', '波羅僧羯諦',
    '菩提薩婆訶', '般若心経'
];





var MP3 = function(url){
    this.setSample(url);
    this.sources = [];
};
MP3.prototype = {
    setSample: function(url){
        var self = this;
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = "arraybuffer";
        req.onload = function(){
            window.ctx.decodeAudioData(
                req.response,
                function(buffer){ self.buffer = buffer; },
                function(err){ console.log('ajax error'); console.log(err); }
            );
        };
        req.send();
    },
    play: function(rate){
        if (typeof this.buffer === 'undefined') return;
        var source = window.ctx.createBufferSource();
        source.buffer = this.buffer;
        source.connect(window.ctx.destination);
        if (typeof rate !== 'undefined') { source.playbackRate = rate; }
        source.start(0);
        this.sources.push(source);
        if (this.sources.length > 10) {
            this.sources.shift().stop();
        }
    },
    stop: function(){
        for (var i=0; i < this.sources.length; i++) {
            this.sources[i].stop(0);
        }
        //this.sources = [];
        this.sources.splice(3);
    }

};


var ASSET_KPS = [0.5, 1, 3, 10, 100, 1000, 10000];
var ASSET_PRICE = [15, 100, 300, 1000, 4000, 10000, 100000];
//var ASSET_PRICE = [1, 2,3,4,5,6,7,8,9];



var Game = function(){
    this.time = 0;
    this.count = 0;
    this.kps = 0;  // kudoku per second
    this.kpc = 1;  // kudoku per click
    this.evaluator = new Evaluator();

    this.assets = [0,0,0,0,0,0,0];

    this.storage = window.localStorage;

    this.view = new GameView(this);
};
Game.prototype = {
    start: function(){
        this.load();
        this.view.updateCount(this.count, this.kps);
        var self = this;
        setInterval(function(){
            self.loop();
        }, 1000);
    },
    loop: function(){
        this.count += this.kps;
        this.evaluate();
        this.view.updateCount(this.count, this.kps);

        console.log(window.KYO[this.time % window.KYO.length]);

        this.time++;
        if (this.time % 60 == 0) {
            this.save();
        }
    },
    evaluate: function(){
        var achievement = this.evaluator.eval(this.count);
        if (typeof achievement !== 'undefined') {
            this.view.showAchievement(achievement);
        }
        this.view.evaluate(this.count);
    },
    click: function(){
        this.count += this.kpc;
        this.view.updateCount(this.count, this.kps);
        this.evaluate();
    },
    addAsset: function(i){
        this.assets[i] += 1;
        this.count -= ASSET_PRICE[i];
        this.kps += ASSET_KPS[i];
        this.view.updateCount(this.count, this.kps);

        this.evaluate();

        if (i == 1) {
            if (this.assets[i] == 1) {
                this.view.showAchievement('Okyo Debut', i, this.assets[i]);
            }
            else {
                this.view.playOkyo(i);
            }
        }
        else if (i == 3) {
            this.view.playBuddha();
        }
        else if (i > 3) {
            if (this.assets[i] == 1) {
                this.view.playOkyo(i);

            }
            else {
                this.view.playOkyoSub();
            }
        }
        return this.assets[i];
    },
    save: function(){
        var g = {
            count: this.count,
            kps: this.kps,
            kpc: this.kpc,
            assets:this.assets
        };
        this.storage.game = JSON.stringify(g);
        this.view.showMessage('Game saved');
    },
    load: function(){
        var s = this.storage.game;
        if (typeof s === 'undefined') return;

        s = s.replace(/(\r\n|\n|\r)/gm, '');
        var g = JSON.parse(s);
        if (g === null) return;
        this.count = g.count;
        this.kps = g.kps;
        this.kpc = g.kpc;

        this.view.load(this.assets);

        for (var i = 0; i < g.assets.length; i++) {
            for (var j = 0; j < g.assets[i]; j++) {
                this.view.addAsset(i);
            }
        }
    },
    reset: function(){
        this.count = 0;
        this.kps = 0;
        this.kpc = 1;
        this.assets = [0,0,0,0,0,0,0];
        this.storage.clear('game');
    }
};

var GameView = function(model){
    this.model = model;
    this.mokugyo = $('#mokugyo');
    this.mokugyo_mp3 = new MP3('./sound/mokugyo.mp3');
    this.gong_mp3 = new MP3('./sound/gong.mp3');
    this.okyo_mp3 = new MP3('./sound/okyo.mp3');
    this.okyo_sub1_mp3 = new MP3('./sound/okyo_sub1.mp3');
    this.okyo_sub2_mp3 = new MP3('./sound/okyo_sub2.mp3');
    this.bm1_mp3 = new MP3('./sound/BM101.mp3');
    this.bm2_mp3 = new MP3('./sound/BM202.mp3');
    this.okyo_mp3.loop = true;
    this.okyo_sub1_mp3.loop = true;
    this.okyo_sub2_mp3.loop = true;
    this.bm1_mp3.loop = true;
    this.bm2_mp3.loop = true;

    this.count_total = $('#count-total');
    this.count_kps   = $('#count-kps');

    this.body = $('body');
    this.left = $('#left');
    this.center = $('#center');
    this.right = $('#right');
    this.achievement = $('#achievement');
    this.asset = $('.asset');
    this.btn_save = $('#save');
    this.btn_reset = $('#reset');

    this.bonji_num = 0;

    this.init();
};
GameView.prototype = {
    init: function(){
        var self = this;
        this.mokugyo.on('click', function(e){self.click(e);});

        $(window).on("load resize", function(){ self.resize(); });

        this.btn_save.on('click', function(){self.save();});
        this.btn_reset.on('click', function(){self.reset();});
    },
    resize: function(){
        this.center.css({
            left: this.left.width(),
            width: this.body.width() - (this.left.width() + this.right.width()) - 10 + 'px'
        });
    },
    click: function(e){
        var pos = [e.clientX, e.clientY];

        var bonji = $('<div class="bonji"></div>');
        var plus = $('<div class="plus">+' + this.model.kpc + '</div>');
        bonji.css({
            'background-position': (this.bonji_num++ % 25) * 50 + 'px 0',
            'left': (pos[0] - 40 + Math.random() * 30) + 'px',
            'top': (pos[1] - 40 + Math.random() * 30) + 'px'
        });
        plus.css({
            'left': (pos[0] + 30) + 'px',
            'top': (pos[1] - 30) + 'px'
        });
        this.left.append(bonji).append(plus);
        window.setTimeout(function(){bonji.remove(); plus.remove();}, 3000);

        this.mokugyo_mp3.play();
        this.model.click();
    },
    updateCount: function(count, kps){
        this.count_total.text(Math.floor(count) + ' kudoku');
        this.count_kps.text('per second: ' + kps);
    },
    showMessage: function(msg){
        var a = $('<div class="message">' + msg + '</div>');
        this.center.append(a);
        window.setTimeout(function(){a.remove();}, 5000);
    },
    showAchievement: function(msg, okyo_num){
        this.showMessage('Achievement :<br>' + msg);
        if (typeof okyo_num === 'undefined') {
            this.gong_mp3.play();
        }
        else if (okyo_num == 1) {
            this.okyo_mp3.play();
        }

    },
    addAsset: function(i){
        var num = this.model.addAsset(i);
        if (i == 1) {
            var face = $('<div class="jakucho-face"></div>');
            face.css({
                top: Math.random() * (this.center.width() - 100) + 'px',
                left: Math.random() * (this.center.height() - 120) + 'px'
            });
            this.center.append(face);

            if (num == 58) {
                this.showAchievement('Goji Hakkyo');
                var youtube = $('<iframe id="youtube" width="130" height="100" src="//www.youtube.com/embed/videoseries?list=PLF3r3_0zc-GKSURk5LjEfd3y4fw2NTHYz&autoplay=1" frameborder="0" allowfullscreen></iframe>');
                this.center.append(youtube);
            }
        }
        else if (i == 3) {
            var buddha = $('<div class="buddha-machine"></div>');
            buddha.css({
                bottom: '0px',
                left: Math.random() * (this.center.height() - 120) + 'px'
            });
            this.center.append(buddha);
        }
    },
    evaluate: function(count){
        var self = this;
        this.asset.each(function(i){
            $(this).children().filter(".asset-kudoku").html(window.ASSET_PRICE[i]); // Auto Setup
            if (count >= window.ASSET_PRICE[i]) {
                if ($(this).hasClass('available')) return;
                $(this).addClass('available').on('click', function(){
                    self.addAsset(self.asset.index(this));
                });
            }
            else {
                $(this).removeClass('available').off();
            }
        });
    },
    playOkyo: function(i){
        this.okyo_mp3.stop();
        this.okyo_mp3.play(ASSET_KPS[i]);
    },
    playOkyoSub: function(){
        var r = Math.random();
        if (r < 0.45) {
            this.okyo_sub1_mp3.play();
        }
        else if (r < 0.93) {
            this.okyo_sub2_mp3.play();
        }
        else {
            this.okyo_mp3.play();
        }
    },
    playBuddha: function(i){
        var r = Math.random();
        if (r < 0.7) {
            this.bm1_mp3.play();
        }
        else {
            this.bm2_mp3.play();
        }
    },
    load: function(assets){
        // if (assets === undefined) return;
    },
    reset: function(){
        this.model.reset();
        $('.jakucho-face').remove();
    },
    save: function(){
        this.model.save();
    }
};

var Evaluator = function(){
    this.pos = 0;
    this.counts = [10, 108, 110359, 1000000000, 5670000000, 1000000000000000000000000];
    this.achievements = ['Ten Bonnoh', 'Bonnoh Master', 'Human Sacrifice', 'Trisahasramahasahasralokadhatu', 'Salvation of Maitreya', 'Nirvana'];
};
Evaluator.prototype = {
    eval: function(count){
        if (count >= this.counts[this.pos]) {
            return this.achievements[this.pos++];
        }
        else {
            return undefined;
        }
    }
};




$(function(){
    window.game = new Game();
    game.start();
});
