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
    },
    stop: function(){
        for (var i=0; i < this.sources.length; i++) {
            this.sources[i].stop(0);
        }
        this.sources = [];
    }

};


var ASSET_KPS = [0.5, 1, 3, 10, 100, 1000, 10000];
var ASSET_PRICE = [15, 100, 300, 1000, 4000, 10000, 100000];
//var ASSET_PRICE = [1, 2,3,4,5,6,7,8,9];



var Game = function(){
    this.count = 0;
    this.kps = 0;  // kudoku per second
    this.kpc = 1;  // kudoku per click
    this.evaluator = new Evaluator();

    this.assets = [0,0,0,0,0,0,0];

    this.view = new GameView(this);
};
Game.prototype = {
    start: function(){
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

        if (this.assets[i] == 1) {
            if (i == 1) {
                this.view.showAchievement('Okyo Debut', i, this.assets[i]);
            }
            else if (i > 2) {
                this.view.playOkyo(i);
            }
        }
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
    this.okyo_mp3.loop = true;
    this.okyo_sub1_mp3.loop = true;
    this.okyo_sub2_mp3.loop = true;

//    this.count = $('#count');
    this.count_total = $('#count-total');
    this.count_kps   = $('#count-kps');

    this.body = $('body');
    this.left = $('#left');
    this.center = $('#center');
    this.right = $('#right');

    this.achievement = $('#achievement');

    this.asset = $('.asset');

    this.bonji_num = 0;

    this.init();
};
GameView.prototype = {
    init: function(){
        var self = this;
        this.mokugyo.on('click', function(e){self.click(e);});

        $(window).on("load resize", function(){ self.resize(); });
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
    showAchievement: function(msg, okyo_num){
        var a = $('<div class="achievement"></div>');
        a.html('achievement :<br>' + msg);
        this.center.append(a);
        window.setTimeout(function(){a.remove();}, 5000);

        if (typeof okyo_num === 'undefined') {
            this.gong_mp3.play();
        }
        else {
            if (okyo_num == 1) {
                this.okyo_mp3.play();
            }
            else {
                if (Math.random() < 0.5) {
                    console.log('sub1');
                    this.okyo_sub1.play();
                }
                else {
                    console.log('sub2');
                    this.okyo_sub2.play();
                }
            }
        }

    },
    addAsset: function(i){
        this.model.addAsset(i);
        if (i == 1) {
            var face = $('<div class="jakucho-face"></div>');
            face.css({
                top: Math.random() * (this.center.width() - 100) + 'px',
                left: Math.random() * (this.center.height() - 120) + 'px'
            });
            this.center.append(face);
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
    }
};

var Evaluator = function(){
    this.pos = 0;
    this.counts = [10, 108];
    this.achievements = ['Ten Bonnoh', 'Bonnoh Master'];
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
