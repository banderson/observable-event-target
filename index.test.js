const ObservableEventTarget = require('./index');
const EventTarget = require('event-target').default;
const Observable = require('zen-observable');

class DummyTarget extends ObservableEventTarget {}

it('implements minimal EventTarget/ObservableEventTarget interface', () => {
  const instance = new DummyTarget();
  expect(typeof instance.addEventListener).toBe('function');
  expect(typeof instance.removeEventListener).toBe('function');
  expect(typeof instance.on).toBe('function');
});


const createEvent = (type, details = {}) =>
  new CustomEvent(type, { details });

describe('#on', () => {
  let instance;
  let handlerFn;
  let observable;
  beforeEach(() => {
    handlerFn = jest.fn();
    instance = new DummyTarget();
    observable = instance.on('something', handlerFn);
  });

  it('returns an Observable', () => {
    expect(observable).toBeInstanceOf(Observable);
  });

  describe('when subscribed', () => {
    let observer;
    let completeFn;
    let nextFn;
    let errorFn;
    let subscription;
    beforeEach(() => {
      nextFn = jest.fn();
      errorFn = jest.fn();
      completeFn = jest.fn();
      observer = {
        next: nextFn,
        error: errorFn,
        complete: completeFn,
      };
      subscription = observable.subscribe(observer);
    });

    it('wires up event handler', () => {
      expect(nextFn).not.toBeCalled();
      instance.dispatchEvent(createEvent('something'));
      expect(nextFn).toBeCalled();
    });
  });
});
