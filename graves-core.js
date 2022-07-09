  // to build: watchify graves.js -o graves.min.js -t browserify-css -v
  if(console) console.log('graves v. 1.0.8');
  var INT_PATH = 'http://www.slate.com/features/2014/09/graves/';
  var LIB_PATH = '/features/lib/js/';
  var SERVER = '/interactives/api/';
  var SERVICE_PATH = SERVER + 'graves/';
  
  
  function Graveyard(wrapper){
    var self = this;
    this.wrapper = wrapper;
    this.$c = $('<div>').appendTo(this.wrapper);
    this.slug = wrapper.data('slug');
    this.data_path = INT_PATH + 'graveyards/'+this.slug+'/';
    // fullWidthPage(this.$c);
    $.when(this.fetchAndBuild(), this.getFlowers()).done(function(build_results, flowers_response){
      if(flowers_response[1] !== 'success'){
        alert('There was trouble connecting to the database. Please check your connection or try again later.');
      }
      else{
        self.printFlowers(flowers_response[0]);
      }
    });
  
  }
  Graveyard.prototype = {
    fetchAndBuild: function(){
      var self = this;
      var def = $.Deferred();
      this.fetchGraveyardData(function(graveyard_data){
        self.conf = graveyard_data;
        self
          .printSign(graveyard_data)
          .printGraves(graveyard_data);
        def.resolve();
      });
      return def.promise();
    },
    fetchGraveyardData: function(callback){
      callback(GRAVES_DATA);
    },
    printSign: function(data){
      var url = this.data_path+'img/'+data.sign;
      if(data.sign!==false){
        var html = '<div class="graveyard_sign_wrapper">'+
          '<img class="graveyard_sign" src="'+url+'"/>'+
        '</div>';
        $(html).appendTo(this.$c);
      }
      return this;
    },
    printGraves: function(data){
      var self = this;
      this.graves = {};
      this.graves_wrapper = $('<div class="graves_wrapper">')
        .appendTo(this.$c);
      $.each(data.graves, function(index, grave){
        self.graves[grave.id] = new Grave(grave, self);
      });
      return this;
    },
    getFlowers: function(){
      return [GRAVES_DATA.graves.reduce((prev, curr, index) => {
        flowers = [];
        repeat(randomInteger(20, 100), () => {
          flowers.push([
            randomInteger(0,100),
            randomInteger(100,170)
          ])
        });
        prev[curr.id] = {n: flowers.length * 50, flowers: flowers }, {}
        return prev;
      }, {}), 'success']
    },
    printFlowers: function(data){
      var printed_graves = this.graves;
      $.each(data, function(grave_id, grave_data){
        if(!data.hasOwnProperty(grave_id)) return;
        var printed_grave = printed_graves[grave_id];
        if(printed_grave === undefined) return;
        printed_grave.setCount(grave_data.n);
        var flowers = grave_data.flowers;
        if(flowers){
          var l = flowers.length;
          for(var i=0; i < l; i++){
            var flower = flowers[i];
            printed_grave.addFlower(false, flower[0], flower[1], flower[2]);
          }
        }
      });
    },
    submitFlower: function(data){
      data.graveyardID = this.slug;
      var url = SERVICE_PATH + this.slug + '/postFlower';
      return $.post(url, data);
    }
  };
  function Grave(conf, par){
    var self = this;
    this.par = par;
    this.count = 0;
    this.name = conf.name;
    this.id = conf.id;
    var template = '<div class="grave">'+
      '<div class="inner">'+
        '<div class="gravestone">'+
          '<table class="name_wrapper">'+
            '<tr>'+
              '<td>'+
                '<p class="name">'+conf.name+'</p>'+
                (conf.sub ? '<p class="sub">'+conf.sub+'</p>' : '') +
              '</td>'+
            '</tr>'+
          '</table>'+
        '</div>'+
        '<div class="tablet"></div>'+
      '</div>'+
      '<div class="graves-bottom"></div>'+
    '</div>';
    this.$c = $(template).appendTo(par.graves_wrapper);
    if (conf.img){
      $('<img class="sigil">')
        .attr('src', this.par.data_path+'img/'+conf.img)
        .prependTo(this.$c.find('td'));
    }
    if (conf.style === "fresh") {
      this.$c.find('.tablet').addClass('fresh');
    }
    else if (conf.style === 'empty'){
      this.$c.addClass('empty');
      this.$c.find('.tablet').addClass('empty');
    }
    if(conf.url){
      this.learn_more = $('<div class="learn_more">')
        .html('<a href="' + conf.url + '" target="_blank">learn more</a>')
        .appendTo(this.$c.find('.graves-bottom'));
    }
    if((!conf.style) || conf.style !== 'empty'){
      this.flower_count = $('<div>')
        .addClass('flower_count')
        .html('0 flowers ')
        .appendTo(this.$c.find('.graves-bottom'));
    }
    if(conf.style !== 'empty'){
      this.$c.find('.inner').click(function(){
        if(!self.flower_added){
          self.addFlower(true);
        }
        else{
          self.showTooltip();
        }
      });
    }
    if(conf.symbols && conf.symbols.length > 0){
      $.each(conf.symbols, function(index, symbol_id){
        var symbol_data = self.par.conf.symbols[symbol_id];
        var symbol = $('<img class="symbol">')
          .attr('src', self.par.data_path + 'img/' + symbol_data.img)
          .css({
            left: symbol_data.x,
            top: symbol_data.y
          })
          .appendTo(self.$c);
      });
    }
    this.gravestone = this.$c.find('.gravestone');
    this.tablet = this.$c.find('.tablet');
    this.inner = this.$c.find('.inner');
    // this.grave_wrapper.appendTo(par.graves_wrapper);
  }
  Grave.prototype.addFlower = function(submit, flower_x, flower_y, flower_type) {
    var self = this;
    if (flower_type === undefined) {
      flower_type = randomInteger(1, 10);
    }
    if (flower_x === undefined) {
      flower_x = randomInteger(1, this.$c.width() - 30);
    }
    if (flower_y === undefined) {
      flower_y = randomInteger(this.gravestone.height(), this.gravestone.height() + this.tablet.height() - 30);
    }
    var flower_obj = $('<div class="flower">')
      .css({
        'background-position': 30 * (flower_type - 1),
        left: flower_x
      }).appendTo(this.inner);
    if (submit === false) {
      flower_obj.css({
        top: flower_y
      });
    }
    else if (submit === true) {
      if (this.par.open_tooltip) {
        this.par.open_tooltip.remove();
      }
      this.flower_added = true;
      this.added_flower = flower_obj
        .css({
          top: 0,
          opacity: 0
        })
        .addClass('added_flower')
        .animate({
          top: flower_y,
          opacity: 1
        }, 1000, function(){
          self.$c.addClass('flower_added');
          self.showTooltip();
        });
      this.setCount(this.count+1);
      this.par.submitFlower({
        graveID: this.id,
        flowerType: flower_type,
        positionX: flower_x,
        positionY: flower_y
      });
    }
  };
  Grave.prototype.setCount = function(count){
    this.flower_count.html(commaSeparateNumber(count) + ' flower'+(count>1?'s':''));
    this.count = count;
  };
  Grave.prototype.showTooltip = function() {
    if (this.par.open_tooltip) {
      this.par.open_tooltip.remove();
    }
    this.par.open_tooltip = new Tooltip(this);
  };
  
  
  function Tooltip(target_grave) {
    var confirmShare, facebookShare, grave_wrapper, pos_x, pos_y, remove, self, target_flower, twitterShare;
    this.target_grave = target_grave;
    self = this;
    remove = function() {
      return self.remove();
    };
    twitterShare = function() {
      if (confirmShare()) {
        // return IntSharing.twitterShare('I left a flower for ' + target_grave.name + ' at the Game of Thrones Graveyard:');
      }
    };
    facebookShare = function() {
      if (confirmShare()) {
        // return IntSharing.facebookShare({
        //   head: 'I left a flower for ' + target_grave.name + ' at the Game of Thrones Graveyard.',
        //   desc: 'Mourn dead Game of Thrones characters' + ' at their virtual graveyard.',
        //   img: 'http://upload.wikimedia.org/wikipedia/en/8/80/' + 'Game_of_thrones_cast.jpg'
        // });
      }
    };
    target_flower = target_grave.added_flower;
    grave_wrapper = target_grave.$c;
    pos_y = target_flower.offset().top - 5;
    pos_x = target_flower.offset().left + target_flower.width() + 15;
    this.triangle = $('<div>').addClass('graves_triangle').css({
      left: pos_x - 25,
      top: pos_y
    }).hide().appendTo('body').fadeIn();
    this.$c = $('<div>').addClass('grave_tooltip').append('<p>You left a flower.</p>').css({
      top: pos_y,
      left: pos_x
    }).hide().appendTo('body').fadeIn();
    var share_data = target_grave.par.conf.share;
    var grave_name = strip(target_grave.name);
    var new_share = {
      fb: {
        head: share_data.fb.head.replace('%s', grave_name),
        desc: share_data.fb.desc.replace('%s', grave_name)
      },
      tw: {
        share_text: share_data.tw.share_text.replace('%s', grave_name)
      },
      email: {
        subject: share_data.email.subject.replace('%s', grave_name),
        body: share_data.email.body.replace('%s', grave_name)
      }
    };
    if(share_data.fb.img){
      new_share.fb.img = share_data.fb.img;
    }
    // IntSharing.appendShareBtns(self.$c, new_share);
    this.btn_ex = $('<p class="btn_ex">X</p>')
      .click(remove)
      .appendTo(this.$c);
    this.target_grave.$c.addClass('tooltip_open');
  }
  
  Tooltip.prototype.remove = function() {
    this.$c.remove();
    this.triangle.remove();
    return this.target_grave.$c.removeClass('tooltip_open');
  };
  
  function pad(num, size) {
    var s;
    s = num + "";
    while (s.lengtfh < size) {
      s = "0" + s;
    }
    return s;
  }
  function commaSeparateNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  function strip(html){
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  
  $(function(){
    $('.int_graves').each(function(){
      new Graveyard($(this));
    });
  }());
  
  function repeat(times, fnc) {
    var i = 0;
    while(i++ < times) {
      fnc()
    }
  }