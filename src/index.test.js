const { assert } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache();

const ONE_BEAT = 1000 * 10;

let heartbeat;
let handler;
let clock;

describe('heartbeat', () => {
  beforeEach(() => {
    global.window = true;
    global.document = {};
    global.document.addEventListener = sinon.spy((event, callback) => { handler = callback; });

    heartbeat = proxyquire('../dist/index', {});
  });

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    document.hidden = true;
    handler(); // stop heartbeat
    delete global.window;
    delete global.document;
    clock.restore();
  });

  it('server safe', () => {
    delete global.window;
    global.document.addEventListener = sinon.spy();
    const serverheartbeat = require('../dist/index');

    const spy = sinon.spy();
    const cancel = serverheartbeat(1, spy);

    clock.tick(ONE_BEAT * 10);

    assert.isTrue(global.document.addEventListener.notCalled, 'didn\'t initialize on server by default');
    assert.isTrue(spy.notCalled, 'didn\'t call callback');
    assert.isFunction(cancel, 'returns a function');

    cancel();
  });

  it('creates listener', () => {
    assert.isTrue(global.document.addEventListener.calledOnce, 'initialized on client');
  });

  it('handles events correctly', () => {
    const spy = sinon.spy();
    const spy2 = sinon.spy();

    const cancel = heartbeat(1, spy);
    const cancel2 = heartbeat(ONE_BEAT * 1000, spy2);

    clock.tick(ONE_BEAT * 10);
    cancel();

    clock.tick(ONE_BEAT * 100);
    cancel2();

    assert.isTrue(spy.called, 'called at least once');
    assert.equal(spy.callCount, 10, 'called exactly 10 times');
    assert.isTrue(spy2.notCalled, 'called only once');
  });

  it('stops when window is not focused', () => {
    const spy = sinon.spy();
    const cancel = heartbeat(1000, spy);

    clock.tick(ONE_BEAT * 10);

    document.hidden = true;
    handler(); // should stop heartbeat
    clock.tick(ONE_BEAT * 10);

    document.hidden = false;
    handler(); // should restart heartbeat
    clock.tick(ONE_BEAT * 9);

    assert.isTrue(spy.called, 'called at least once');
    assert.equal(spy.callCount, 20, 'called exactly 20 times');

    cancel();
  });

  it('multiple unsubscribes', () => {
    const spy = sinon.spy();
    const cancel = heartbeat(1, spy);

    clock.tick(ONE_BEAT);
    cancel();
    cancel();
    cancel();
    clock.tick(ONE_BEAT * 10);

    assert.isTrue(spy.calledOnce, 'called once');
  });

  it('listener unsubscribes another listener', () => {
    let unsubscribe;
    const spy = sinon.spy(() => unsubscribe && unsubscribe());

    unsubscribe = heartbeat(1, spy);
    unsubscribe = heartbeat(1, spy);

    clock.tick(ONE_BEAT);

    assert.isTrue(spy.calledOnce, 'call count correct');
  });
});
