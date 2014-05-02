/**
 * Module dependencies
 */

var type = require('type');
var domify = require('domify');
var Masonry = require('./masonry');
var moment = require('moment');
var loaded = require('imagesloaded');
var Emitter = require('emitter');

/**
 * Templates
 */

var template = require('./templates/timeline.html');
var itemTemplate = require('./templates/item.html');
var yearLabel = require('./templates/year.html');

/**
 * Expose Timeline
 */

module.exports = Timeline;

function Timeline(el){
  if (!(this instanceof Timeline)) return new Timeline(el);
  this.container = el;
  this.el = domify(template);
  this.$grid = this.el.querySelector('#timeline-content');
}

Emitter(Timeline.prototype);

Timeline.prototype.data = function(docs, dateField){
  this.docs = docs;
  this.dateField = dateField;
  this.parseDates();
  this.sort();
  this.getDateRange();
  return this;
};

Timeline.prototype.parseDates = function(){
  this.docs.map(function(doc){
    var d = new Date();
    d.setFullYear(doc[this.dateField]);
    doc[this.dateField] = d;
  }, this);
  console.log(this.docs);
  return this;
};

Timeline.prototype.sort = function(key){
  var k = key || this.dateField;
  this.docs.sort(function(a, b){
    if (a[k] < b[k]) return -1;
    if (a[k] > b[k]) return 1;
    return 0;
  });
  return this;
}

Timeline.prototype.render = function(template){
  this.container.appendChild(this.el);
  this.el.classList.add('loading');

  var startDate = this.dateRange[0];

  var fragment = document.createDocumentFragment();

  function insertLabel(yr){
    startDate = yr;
    var $year = domify(yearLabel);
    $year.querySelector('.year-label-content').innerHTML = '<span>'+ yr + '</span>';
    $year.setAttribute('data-year', yr);
    fragment.appendChild($year);
  }
  
  // create our items
  for (var i = 0, len = this.docs.length; i < len; i++){
    var doc = this.docs[i];

    // insert our 'year' labels if need be
    var year = nearestTenDown(doc[this.dateField].getFullYear());
    if (year > startDate) {
      for (var c = startDate + 10; c < year + 10; c += 10) {
        insertLabel(c);
      }
    }

    // create our element
    var el = domify(itemTemplate);
    var tmp = template(doc, el);
    var content = (type(tmp) === 'string') ? domify(tmp) : tmp;
    el.querySelector('.item-content').appendChild(content);
    fragment.appendChild(el);
  }

  // append grid to dom
  this.$grid.appendChild(fragment);

  // create our masonry
  function createMasonry(){
    this.grid = new Masonry(this.$grid);

    // determine which ones are aligned on the left
    // (this is kinda crappy) and could be slow
    var childs = this.$grid.children;
    for (var p = 0, l = childs.length; p < l; p++){
      var item = childs[p];
      if (item.style.left == '0px') item.classList.add('showing-left');
      else item.classList.add('showing-right');
    }
    this.el.classList.remove('loading');
  }

  loaded(this.el, createMasonry.bind(this));
  return this;
};

/**
 * Get date range in 10 year intervals (this should be
 * more flexibile for general purpose use)
 * 
 * @return {Timeline} 
 */

Timeline.prototype.getDateRange = function(){
  var first = nearestTenDown(this.docs[0][this.dateField].getFullYear());
  var last = nearestTenUp(this.docs[this.docs.length - 1][this.dateField].getFullYear());
  this.dateRange = [first];
  for (var i = first; i <= last; i += 10) {
    this.dateRange.push(i);
  }
  return this;
}

function nearestTenUp(num){
  return Math.ceil(num / 10) * 10;
}

function nearestTenDown(num){
  return Math.floor(num / 10) * 10;
}