/**
  * a light & easy scroller for mobile web apps
  * License MIT (c) 岑安
  */

;(function (name, definition) {
    if (typeof define == 'function') define(definition);
    else if (typeof module != 'undefined') module.exports = definition();
    else this[name] = definition();
})('jstemplate', function () {  
    // private methods
    function extend (target, source, isOverwrite) {
        if (isOverwrite == undefined) {
            isOverwrite = true;
        }
        for (var k in source) {
            if (!(k in target) || isOverwrite) {
                target[k] = source[k];
            }
        }
        return target;
    }
    
    //eScroll
    /**
     * eScroll
     * @opt [object]
     * {
            element: ,
            isEase: ,
            mouseSimulate: ,
            lockY: ,
            lockX: 
       }
    */
    var EScroll = function (opt) {
        
        this.opt = {
            //defaults
            element: null,
            isEase: true,
            mouseSimulate: false,
            lockY: false,
            lockX: true
        };
        extend(this.opt, opt || {});
        if (!this.opt.element) {
            return (console && console.error('EScroll - no element'));
        }
        
        this.element = typeof this.opt.element == 'string' ? document.querySelector(this.opt.element) : this.opt.element;
        this.con = this.element.querySelector('*');
        if (this.opt.mouseSimulate) { this.element.style.overflow = 'hidden'; }
        
        this.supportTransform3d = ('WebKitCSSMatrix' in window);
        this.supportTouch = ('ontouchstart' in window);
        this._e = {
            'start': this.supportTouch ? 'touchstart' : 'mousedown',
            'move': this.supportTouch ? 'touchmove' : 'mousemove',
            'end': this.supportTouch ? 'touchend' : 'mouseup',
        };
        
        this._touchStartY = 0;
        this._translateY = 0;
        this._newTranslateY = 0;
        this._isTouching = false;

        this._lastMovingY = 0;
        this.speedY = 0;
        
        this._bind();
    }
    EScroll.prototype = {
        _bind: function () {
            var me = this;

            this.element.addEventListener('touchstart', function (e) { me._onTouchStart(e) }, false);
            this.element.addEventListener('touchmove', function (e) { me._onTouchMove(e) }, false);
            this.element.addEventListener('touchend', function (e) { me._onTouchEnd(e) }, false);
            this.element.addEventListener('touchcancel', function (e) { me._onTouchCancel(e) }, false);
        },
        _getPage: function (event, page) {
            return this.supportTouch ? event.changedTouches[0][page] : event[page];
        },
        _getTranslateY: function (y) {
            return this.supportTransform3d ? 'translate3d(0, '+y+'px, 0)' : 'translate(0, '+y+'px)';
        },
        _getTranslateX: function (x) {
            return this.supportTransform3d ? 'translate3d('+x+'px, 0, 0)' : 'translate('+x+'px, 0)';
        },
        _limitY: function (y) {
            var minY = this.element.offsetHeight - this.element.scrollHeight;
            if (y > 0) {
                y = 0;
            } else if (y < minY) {
                y = minY;
            }
            
            return y;
        },
        _limitY2: function (y) {
            var minY = this.element.offsetHeight - this.element.scrollHeight - 60,
                maxY = 60;
            if (y > maxY) {
                y = maxY;
            } else if (y < minY) {
                y = minY;
            }
            
            return y;
        },
        _isOverLimit: function (y) {
            return (y > 0 || y < this.element.offsetHeight - this.element.scrollHeight) ? true : false;
        },
        
        _onTouchStart: function (e) { alert(6)
            clearTimeout(this.__fixPosTimer);
            this._isTouching = true;
            this._touchStartY = this._getPage(e, 'pageY');
            this._lastMovingY = this._touchStartY;
            
            this.con.style.webkitTransitionDuration = '0';
        },
        _onTouchMove: function (e) {
            this.supportTouch && e.preventDefault();
            
            if (this._isTouching) {
                clearTimeout(this.__fixPosTimer);
                var nowY = this._getPage(e, 'pageY'),
                    disY = nowY - this._touchStartY;
                    
                //get speed
                this.speedY = nowY - this._lastMovingY;
                this._lastMovingY = nowY;
                    
                this._newTranslateY = this._translateY + disY;
                //limit translateY
                if (!this.opt.isEase) {
                    this._newTranslateY = this._limitY(this._newTranslateY);
                }
                
                this.con.style.webkitTransform = this._getTranslateY(this._newTranslateY);
            }
            
            
        },
        _onTouchEnd: function (e) {
            if (!this._isTouching) { return; }
            var me = this;
            
            this._isTouching = false;
            this._translateY = this._newTranslateY;
            
            //handle ease
            if (this.opt.isEase) {
                this.con.style.webkitTransitionDuration = '500ms';
                
                if (this._isOverLimit(this._translateY)) {
                    clearTimeout(this.__fixPosTimer);
                    me._translateY = me._limitY(me._translateY);
                    me.con.style.webkitTransform = me._getTranslateY(me._translateY); 
                } else {
                    var tempY = this._translateY + this.speedY * 10;
                    this._translateY = this._limitY2(tempY);
                    this.con.style.webkitTransform = this._getTranslateY(this._translateY);
                    
                    clearTimeout(this.__fixPosTimer);
                    this.__fixPosTimer = setTimeout(function () {
                        me._translateY = me._limitY(me._translateY);
                        me.con.style.webkitTransform = me._getTranslateY(me._translateY);
                        me._newTranslateY = me._translateY;
                    }, 500);    
                }
                
            }
            
            this.speedY = 0;
            this._newTranslateY = this._translateY;
        },
        _onTouchCancel: function (e) {
            
        },
        /**
         * scrollTo
         * @pos [number] set the pos of scrollTo
         */
        scrollTo: function (pos) {
            if (this.supportTouch) {
                this.con.style.webkitTransitionDuration = '500ms';
                pos = this._limitY(pos);
                this.con.style.webkitTransform = this._getTranslateY(pos);
                this._translateY = pos;
            } else {
                this.element.scrollTop = 0 - pos;
            }
        },
        setActiveEl: function (el) {
            el = typeof el == 'string' ? document.querySelector(el) : el;
            this.con = el;
            this.con.style.webkitTransform = this._getTranslateY(0);
            this._translateY = 0;
            this._newTranslateY = 0;
            this.speedY = 0;
            this._lastMovingY = 0;
        }
        
    };
    
    this.EScroll = EScroll;
    return EScroll;
    
});