// window.ctx = webkitAudioContext();

var Game = function(){
    this.count = 0;
    this.kps = 0;  // kudoku per second
    this.kpc = 1;  // kudoku per click
    this.evaluator = new Evaluator();

    this.view = new GameView(this);

    this.canvas = $('#left-bg');
};
Game.prototype = {
    start: function(){
        var self = this;
        setInterval(function(){
            self.loop();
        }, 1000);
    },
    loop: function(){
        this.count += this.kps;
        this.evaluate();
    },
    evaluate: function(){
        var achievement = this.evaluator.eval(this.count);
        if (typeof achievement !== 'undefined') {
            this.view.showAchievement(achievement);
        }
    },
    click: function(){
        this.count++;
    }
};

var GameView = function(model){
    this.model = model;
    this.mokugyo = $('#mokugyo');
    this.mokugyo_mp3 = $('#mokugyo_mp3');

    this.left = $('#left');
    this.center = $('#center');
    this.right = $('#right');

    this.bonji_num = 0;

    this.init();
};
GameView.prototype = {
    init: function(){

        var self = this;
        this.mokugyo.on('click', function(e){self.click(e);});
    },
    click: function(e){
        var pos = [e.clientX, e.clientY];

        var bonji = $('<div class="bonji"></div>');
        bonji.css({
            'background-position': (this.bonji_num++ % 10) * 50 + 'px 0',
            'left': (pos[0] - 40 + Math.random() * 30) + 'px',
            'top': (pos[1] - 40 + Math.random() * 30) + 'px'
        });
        this.left.append(bonji);
        setTimeout(function(){bonji.remove();}, 2000);

        var m = $.extend(true, {}, this.mokugyo_mp3)[0];
        m.load();
        m.play();
        this.model.click();
    },
    showAchievement: function(msg){
        console.log('Achievement: ' + msg);
    }
};

var Evaluator = function(){
    this.pos = 0;
    this.counts = [10, 100, 1000];
    this.achievements = ['yes', 'hundred', 'thousand'];
};
Evaluator.prototype = {
    eval: function(count){
        if (count > this.counts[this.pos]) {
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
