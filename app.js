(function() {
    var _oPage;
    var _oList;
    var _aLi;
    var _aBtns;

    var _aRemove = [];
    var _recycles = [];
    var _3dBoxes = [];

    // 开关, 控制按钮是选择还是取消.
    //  true - 为选择
    //  false - 为取消
    var _bOff = true;

    window.onload = function() {
        var _imgData = makeImgData();

        _oPage = document.getElementById('page');
        _oList = document.getElementById('picList');
        _aLi = document.getElementsByTagName('li');
        _aBtns = _oPage.getElementsByClassName('btn');
        _recycles = document.getElementsByClassName('recycle');
        _3dBoxes = _oPage.getElementsByClassName('box-3d');

        // 添加图片到页面.
        init(_imgData);

        // 设置每张图片的left, top值.
        // 以方便在删除时实现动画效果.
        // 使用setTimeout, 解决transition在页面刷新显示动画的
        // 问题. 因为transition只能在元素全部渲染后才能生效.
        setTimeout(toPosition, 50);

        // 给选择按钮添加事件.
        _aBtns[1].addEventListener('touchend', fnEnd, false);
        _aBtns[0].addEventListener('touchend', fnRemove, false);
    }

    function makeImgData() {
        var _data = [];

        for (var i = 1; i <= 16; i++) {
            _data.push('video/' + i + '.jpg');
        }

        return _data;
    }

    function init(data) {
        var _oList = document.getElementById('picList');
        var _sHtml = '';

        for (var i = 0; i < data.length; i++) {
            _sHtml += '<li style="background-image: url(' + data[i] + ')" /></li>'
        }

        _oList.innerHTML = _sHtml;
    }

    function fnEnd() {
        if (_bOff) {
            this.innerHTML = '取消';
            var _len = _aLi.length;
            for (var i = 0; i < _len; i++) {
                _aLi[i].index = i;
                _aLi[i].addEventListener('touchend', fnSelected, false);
            }
        } else {
            this.innerHTML = '选择';

            // 隐藏顶部的删除按钮.
            _aBtns[0].style.display = 'none';

            var _removedLen = _aRemove.length;
            for (var i = 0; i < _removedLen; i++) {
                (function(m, liNum) {
                    close3d(_3dBoxes[m], function() {
                        // 恢复选中元素的透明度
                        _aLi[liNum].style.opacity = 1;

                        // 隐藏垃圾桶
                        _recycles[0].style.top = _recycles[1].style.top = '100%';
                    });
                })(i, _aRemove[i])
            }

            // 移除事件以至于用户不能再选择图片.
            var _len = _aLi.length;
            for (var i = 0; i < _len; i++) {
                // 移除选择事件.
                _aLi[i].removeEventListener('touchend', fnSelected, false);
            }

            // 清空要删除的数组的列表.
            _aRemove.length = 0;
        }

        _bOff = !_bOff;
    }

    function fnSelected() {
        this.style.opacity = 0.1;

        // 把当前元素的索引添加到_aRemove数组中, 方便以后删除.
        _aRemove.push(this.index);

        // 显示顶部的删除按钮.
        _aBtns[0].style.display = 'block';

        // 显示垃圾桶
        _recycles[0].style.top = _recycles[1].style.top = '92%';

        create3d(this);
    }

    function fnRemove() {
        // 对数组从大到小排序
        _aRemove.sort(function(a, b) {
            return a - b;
        });

        for (var i = 0; i < _aRemove.length; i++) {
            fnDel(i);
        }

        setTimeout(function() {
            while (_aRemove.length) {
                // 每次从后往前删除, 确保li的索引不会发生变化.
                var _iNum = _aRemove.pop();

                _oPage.removeChild(_3dBoxes[_aRemove.length]);
                _oList.removeChild(_aLi[_iNum]);
            }

            // 删除后重新计算每张图片的位置.
            toPosition();

            fnEnd.call(_aBtns[1]);

            // 隐藏垃圾桶
            _recycles[0].style.top = _recycles[1].style.top = '100%';

        }, 600);

        // 重置选择按钮状态和重新计算li索引.
        _bOff = false;
    }

    /**
     * 显示3d删除动画.
     * @param  {number} iNum 选中元素数组中元素的索引
     */
    function fnDel(iNum) {
        var _3dEle = _3dBoxes[iNum];

        // 显示3d删除动画
        _3dEle.style.top = '100%';
        _3dEle.style.left = 'calc(50% - 2rem)';
    }

    function toPosition() {
        var _len = _aLi.length;

        for (var i = 0; i < _len; i++) {
            _aLi[i].style.left = (i % 3) * 4 + 'rem';
            _aLi[i].style.top = Math.floor(i / 3) * 4 + 'rem';
        }
    }

    function open3d(obj) {
        var _aDiv = obj.getElementsByTagName('div');
        var _len = _aDiv.length;

        for (var i = 0; i < _len; i++) {
            _aDiv[i].style.WebkitTransition = _aDiv[i].style.MozTransition = _aDiv[i].style.transition = '0.4s';
            _aDiv[i].className = 'show';
        }
    }

    /**
     * 移除指定元素的3d效果.
     * @param  {Element} obj 要移除3d效果的元素
     * @param  {Function} fn 动画完成后的回调函数.
     */
    function close3d(obj, fn) {
        var _aDiv = obj.getElementsByTagName('div');
        var _len = _aDiv.length;

        for (var i = 0; i < _len; i++) {
            _aDiv[i].className = '';
        }

        // 对最后一个div元素添加动画完成回调函数
        var _lastEle = _aDiv[_len - 1];

        addTransitionEndEvent(_lastEle, function() {
            // 从页面中把3d元素删除.
            obj.parentElement.removeChild(obj);

            fn && fn();
        });
    }

    /**
     * 添加transitionend 事件到指定的元素
     * @param {Element}   obj 监听的元素
     * @param {Function} fn 动画结束时的回调
     */
    function addTransitionEndEvent(obj, fn) {
        obj.addEventListener('webkitTransitionEnd', end, false);
        obj.addEventListener('mozTransitionEnd', end, false);
        obj.addEventListener('transitionend', end, false);

        function end() {
            // 移除事件监听.
            obj.removeEventListener('webkitTransitionEnd', end, false);
            obj.removeEventListener('mozTransitionEnd', end, false);
            obj.removeEventListener('transitionend', end, false);

            fn && fn();
        }
    }

    function create3d(oLi) {
        var _oDiv = document.createElement('div');
        var _offset = getOffset(oLi);

        _oDiv.className = 'box-3d';

        _oDiv.style.backgroundImage = oLi.style.backgroundImage;
        _oDiv.style.left = _offset.left + 'px';
        _oDiv.style.top = _offset.top + 'px';

        _oDiv.innerHTML = '<div>' +
            '<div style="background-position: -0.4rem 0">' +
            '<div style="background-position: -0.8rem 0">' +
            '<div style="background-position: -1.2rem 0">' +
            '<div style="background-position: -1.6rem 0">' +
            '<div style="background-position: -2rem 0">' +
            '<div style="background-position: -2.4rem 0">' +
            '<div style="background-position: -2.8rem 0">' +
            '<div style="background-position: -3.2rem 0">' +
            '<div style="background-position: -3.6rem 0"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        _oPage.appendChild(_oDiv);

        setTimeout(function() {
            open3d(_oDiv);
        }, 50);
    }

    function getOffset(obj) {
        var l = 0;
        var t = 0;
        while (obj) {
            l += obj.offsetLeft;
            t += obj.offsetTop;

            obj = obj.offsetParent;
        }

        return {
            left: l,
            top: t
        };
    }
})();