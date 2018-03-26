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


const createEvent = (type, details = {}) => {
  return new CustomEvent(type, { details });
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
  let handlerFn;
  let observable;
  let observer;
  let subscription;
  beforeEach(() => {
    handlerFn = jest.fn();
    instance = new DummyTarget();
    // HACK workaround for JSDOM not suppporting extendable EventTarget
    // https://github.com/jsdom/jsdom/issues/2156#issuecomment-367965364
    const proxy = new Proxy(instance, {});
    proxy._document = window.document;
    // END HACK
    observable = instance.on('something', handlerFn);
  });

  it('returns an Observable', () => {
    expect(observable).toBeInstanceOf(Observable);
  });

  describe('when subscribed', () => {
    beforeEach(() => {
      ({observer, subscription} = createSubscription(observable));
    });

    it('wires up event handler', () => {
      expect(observer.next).not.toBeCalled();
      instance.dispatchEvent(createEvent('something'));
      expect(observer.next).toBeCalled();
    });
  });

  describe('with opts.once', () => {
    beforeEach(() => {
      observable = instance.on('something', handlerFn, { once: true });
      ({observer, subscription} = createSubscription(observable));
    });

    it('is completed after first dispatch', () => {
      instance.dispatchEvent(createEvent('something'));
      expect(subscription.closed).toBe(true);
    });
  });
});
