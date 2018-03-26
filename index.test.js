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

const createEvent = (type, detail = {}) => {
  return new CustomEvent(type, { cancelable: true, detail });
};

const createSubscription = observable => {
  const observer = {
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn(),
  };
  subscription = observable.subscribe(observer);

  return { subscription, observer };
};

describe('#on', () => {
  let instance;
  let observable;
  let observer;
  let subscription;
  beforeEach(() => {
    // HACK workaround for JSDOM not suppporting extendable EventTarget
    // https://github.com/jsdom/jsdom/issues/2156#issuecomment-367965364
    instance = new DummyTarget();
    const proxy = new Proxy(instance, {});
    proxy._document = window.document;
    // END HACK
    observable = instance.on('something');
  });

  it('returns an Observable', () => {
    expect(observable).toBeInstanceOf(Observable);
  });

  describe('when subscribed', () => {
    beforeEach(() => {
      ({ observer, subscription } = createSubscription(observable));
    });

    it('wires up event handler', () => {
      expect(observer.next).not.toBeCalled();
      instance.dispatchEvent(createEvent('something'));
      expect(observer.next).toBeCalled();
    });
  });

  describe('with opts.once', () => {
    beforeEach(() => {
      observable = instance.on('something', { once: true });
      ({ observer, subscription } = createSubscription(observable));
    });

    it('is completed after first dispatch', () => {
      instance.dispatchEvent(createEvent('something'));
      expect(subscription.closed).toBe(true);
    });
  });

  describe('with opts.handler', () => {
    let handlerFn;
    beforeEach(() => {
      handlerFn = jest.fn();
      observable = instance.on('event-name', {
        handler: handlerFn,
      });
      ({ observer, subscription } = createSubscription(observable));
    });

    it('is invoked on event dispatches', () => {
      expect(handlerFn).not.toBeCalled();
      instance.dispatchEvent(createEvent('event-name'));
      expect(handlerFn).toBeCalled();
    });

    it('is invoked before observer.next', () => {
      observable = instance.on('event-name', {
        handler: e => {
          e.detail.modified = true;
        },
      });
      ({ observer, subscription } = createSubscription(observable));
      instance.dispatchEvent(createEvent('event-name', { modified: false }));
      expect(observer.next.mock.calls.length).toBe(1);
      expect(observer.next.mock.calls[0][0].detail).toEqual({ modified: true });
    });

    it('can cancel observer.next call via preventDefault', () => {
      observable = instance.on('event-name', {
        handler: e => {
          e.preventDefault();
        },
      });
      ({ observer, subscription } = createSubscription(observable));
      expect(observer.next).not.toBeCalled();
      instance.dispatchEvent(createEvent('event-name'));
      expect(observer.next).not.toBeCalled();
    });
  });
});
