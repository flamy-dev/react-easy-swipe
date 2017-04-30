import React from 'react';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import chaiSinon from 'chai-sinon';
import ReactSwipe, { setHasSupportToCaptureOption } from '../src/react-swipe';
import { shallow } from 'enzyme';
import sinon from 'sinon';

chai.use(chaiEnzyme());
chai.use(chaiSinon);

describe('react-swipe', () => {
  let instance;
  let wrapper;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    wrapper = shallow(<ReactSwipe />);
    instance = wrapper.instance();
  });

  it('should render a div by default', () => {
    expect(wrapper).to.have.tagName('div');
  });

  it('should allow to choose a different tag', () => {
    wrapper.setProps({
      tagName: 'ul'
    });

    expect(wrapper).to.have.tagName('ul');
  });

  it('should pass down the styles', () => {
    const style = {
      margin: '333'
    };
    wrapper.setProps({ style });

    expect(wrapper).to.have.prop('style', style);
  });

  it('should pass down the className', () => {
    wrapper.setProps({ className: 'mySwiper' });

    expect(wrapper).to.have.prop('className', 'mySwiper');
  });

  it('should attach a handler for onMouseDown', () => {
    expect(wrapper).to.have.prop('onMouseDown', instance._onMouseDown);
  });

  it('should attach a handler for onTouchMove on componentDidMount, using a cross browser passive: false', () => {

    setHasSupportToCaptureOption(false);

    instance.swiper = {
      addEventListener: sandbox.spy()
    };

    instance.componentDidMount();

    expect(instance.swiper.addEventListener).to.have.callCount(1);
    expect(instance.swiper.addEventListener).to.have.been.calledWith('touchmove', instance._handleSwipeMove, true);

    setHasSupportToCaptureOption(true);
    instance.componentDidMount();

    expect(instance.swiper.addEventListener).to.have.been.calledWith('touchmove', instance._handleSwipeMove, {
      capture: true,
      passive: false
    });
  });

  it('should attach a handler for onTouchStart', () => {
    expect(wrapper).to.have.prop('onTouchStart', instance._handleSwipeStart);
  });

  it('should attach a handler for onTouchEnd', () => {
    expect(wrapper).to.have.prop('onTouchEnd', instance._handleSwipeEnd);
  });

  context('swiping', () => {
    context('onSwipeStart', () => {
      let onSwipeStart;

      const event = {
        touches: [{
          pageX: 123,
          pageY: 321
        }]
      };

      beforeEach(() => {
        onSwipeStart = sandbox.spy();

        wrapper.setProps({ onSwipeStart });
      });

      it('should store the coordinates x and y', () => {
        instance._handleSwipeStart(event);

        expect(instance.moveStart).to.be.deep.equal({
          x: 123,
          y: 321
        });
      });

      it('should call props.onSwipeStart with the event', () => {
        instance._handleSwipeStart(event);

        expect(onSwipeStart).to.have.been.calledWith(event);
      });
    });

    context('onSwipeMove', () => {
      let onSwipeMove;

      const event = {
        touches: [{
          pageX: 123,
          pageY: 321
        }]
      };

      beforeEach(() => {
        onSwipeMove = sandbox.stub();

        wrapper.setProps({ onSwipeMove });

        instance.moveStart = {
          x: 10,
          y: 10
        };
      });

      it('should store moving = true', () => {
        instance._handleSwipeMove(event);

        expect(instance.moving).to.be.equal(true);
      });

      it('should call props.onSwipeMove with the delta of initial position and current position, and the event', () => {
        instance._handleSwipeMove(event);

        expect(onSwipeMove).to.have.been.calledWith({
          x: 113,
          y: 311
        }, event);
      });

      it('should call prevent default if the result of onSwipeMove is true', () => {
        const preventDefault = sandbox.spy();

        instance._handleSwipeMove({ ...event, preventDefault });

        expect(preventDefault).to.have.callCount(0);

        onSwipeMove.returns(true);

        instance._handleSwipeMove({ ...event, preventDefault });

        expect(preventDefault).to.have.callCount(1);
      });

      it('should store the current position', () => {
        instance._handleSwipeMove(event);

        expect(instance.movePosition).to.be.deep.equal({
          deltaX: 113,
          deltaY: 311
        });
      });
    });

    context('onSwipeEnd', () => {
      let onSwipeEnd;
      let onSwipeLeft;
      let onSwipeRight;
      let onSwipeUp;
      let onSwipeDown;

      const event = {
        touches: [{
          pageX: 123,
          pageY: 321
        }]
      };

      beforeEach(() => {
        onSwipeEnd = sandbox.spy();
        onSwipeLeft = sandbox.spy();
        onSwipeRight = sandbox.spy();
        onSwipeUp = sandbox.spy();
        onSwipeDown = sandbox.spy();

        instance.moveStart = {
          x: 10,
          y: 10
        };

        instance.moving = true;

        instance.movePosition = {
          deltaX: 113,
          deltaY: 311
        };

        wrapper.setProps({
          onSwipeEnd,
          onSwipeLeft,
          onSwipeRight,
          onSwipeUp,
          onSwipeDown
        });
      });

      it('should call props.onSwipeEnd with the event', () => {
        instance._handleSwipeEnd(event);

        expect(onSwipeEnd).to.have.been.calledWith(event);
      });

      it('should call onSwipeLeft if deltaX is lower than 0', () => {
        instance.movePosition.deltaX = -10;
        instance._handleSwipeEnd(event);

        expect(onSwipeLeft).to.have.been.calledWith(1, event);
      });

      it('should call onSwipeRight if deltaX is greater than 0', () => {
        instance.movePosition.deltaX = 10;
        instance._handleSwipeEnd(event);

        expect(onSwipeRight).to.have.been.calledWith(1, event);
      });

      it('should call onSwipeUp if deltaY is lower than 0', () => {
        instance.movePosition.deltaY = -10;
        instance._handleSwipeEnd(event);

        expect(onSwipeUp).to.have.been.calledWith(1, event);
      });

      it('should call onSwipeDown if deltaY is greater than 0', () => {
        instance.movePosition.deltaY = 10;
        instance._handleSwipeEnd(event);

        expect(onSwipeDown).to.have.been.calledWith(1, event);
      });

      it('should reset moveStart, moving and movePosition', () => {
        instance._handleSwipeEnd(event);
        expect(instance.moveStart).to.be.equal(null);
        expect(instance.moving).to.be.equal(false);
        expect(instance.movePosition).to.be.equal(null);
      });
    });

    context('emulating swipe with mouse', () => {
      const event = {
        screenX: 123,
        screenY: 321
      };

      let addEventListener;
      let removeEventListener;

      beforeEach(() => {
        addEventListener = sandbox.stub();
        removeEventListener = sandbox.stub();

        global.document = { addEventListener, removeEventListener };

        sandbox.stub(instance, '_handleSwipeStart');
        sandbox.stub(instance, '_handleSwipeMove');
        sandbox.stub(instance, '_handleSwipeEnd');

        wrapper.setProps({
          allowMouseEvents: true
        });
      });

      afterEach(() => {
        global.document = null;
      });

      context('onMouseDown', () => {
        it('should store mouseDown = true', () => {
          instance._onMouseDown(event);
          expect(instance.mouseDown).to.be.equal(true);
        });

        it('should add event handlers for mouseup and mousemove', () => {
          instance._onMouseDown(event);
          expect(addEventListener).to.have.been.calledWith('mouseup', instance._onMouseUp);
          expect(addEventListener).to.have.been.calledWith('mousemove', instance._onMouseMove);
        });

        it('should call _handleSwipeStart', () => {
          instance._onMouseDown(event);
          expect(instance._handleSwipeStart).to.have.been.calledWith(event);
        });
      });

      context('onMouseMove', () => {
        it('should call _handleSwipeMove', () => {
          instance._onMouseMove(event);
          expect(instance._handleSwipeMove).to.have.callCount(0);

          instance.mouseDown = true;
          instance._onMouseMove(event);
          expect(instance._handleSwipeMove).to.have.been.calledWith(event);
        });
      });

      context('onMouseUp', () => {
        it('should store mouseDown = false', () => {
          instance._onMouseUp(event);
          expect(instance.mouseDown).to.be.equal(false);
        });

        it('should remove the event handlers for mouseup and mousemove', () => {
          instance._onMouseUp(event);
          expect(removeEventListener).to.have.been.calledWith('mouseup', instance._onMouseUp);
          expect(removeEventListener).to.have.been.calledWith('mousemove', instance._onMouseMove);
        });

        it('should call _handleSwipeEnd', () => {
          instance._onMouseUp(event);
          expect(instance._handleSwipeEnd).to.have.been.calledWith(event);
        });
      });
    });
  });
});
