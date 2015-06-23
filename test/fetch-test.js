var expect = require('chai').expect;
var sinon =  require('sinon');
var rewire = require('rewire');
var Bluebird = require('bluebird');

var fetchIndex = rewire('../fetch');

var basicReq = {
  query: {}
};

var testApi = require('./helpers/test-api');

var AzureClientApi = testApi.AzureClientApi;

var AzureApi = testApi.AzureApi;

var config = {
  accountName: 'test',
  accessKey: '934209jassadas'
};

describe('fetch', function() {
  var sandbox;
  before(function() {
    sandbox = sinon.sandbox.create();
    fetchIndex.__set__('azure', AzureApi);
  });

  afterEach(function() {
    fetchIndex.__set__('initialized', false);
    sandbox.restore();
  });

  describe('_getOpts', function() {
    var _getOpts;

    beforeEach(function () {
      _getOpts = fetchIndex.__get__('_getOpts');
    });

    it('has a default revisionQueryParam', function() {
      expect(_getOpts().revisionQueryParam).to.equal('index_key');
    });

    it('allows override of revisionQueryParam', function() {
      expect(_getOpts({revisionQueryParam: 'foobar'}).revisionQueryParam).to.equal('foobar');
    });
  });

  describe('_initialize', function () {
    var _initialize;
    before(function() {
      _initialize = fetchIndex.__get__('_initialize');
    });

    describe('azure client initialize', function() {

      it('sets up azure (config passed)', function() {
        var azureMock = sandbox.mock(AzureApi);
        azureMock.expects('createTableService').
          withArgs(config.accountName, config.accessKey).
          once();

        _initialize(config);

        azureMock.verify();
      });
    });

    describe('options initialize', function() {
      var _getOptsStub, _getOpts;
      before(function() {
        _getOpts = fetchIndex.__get__('_getOpts');
      });

      beforeEach(function() {
        _getOptsStub = sandbox.stub();
        fetchIndex.__set__('_getOpts', _getOptsStub);
      });

      after(function() {
        fetchIndex.__set__('_getOpts', _getOpts);
      });

      it('calls _getOpts', function() {
        _initialize(config);

        expect(_getOptsStub.calledOnce).to.be.true;
      });
    });

    it('sets initialized flag', function() {
      expect(fetchIndex.__get__('initialized')).to.be.false;
      _initialize(config);
      expect(fetchIndex.__get__('initialized')).to.be.true;
    });
  });

  describe('fetchIndex', function() {
    var azure, azureSpy, _initialize;

    before(function() {
      azure = AzureClientApi;
      _initialize = fetchIndex.__get__('_initialize');
    });

    beforeEach(function() {
      azureSpy = sandbox.spy(azure, 'retrieveEntity');
      _initialize(config);
    });

    afterEach(function() {
      azure.flushall();
    });

    it('normalizes spaces in revisionQueryParam', function(done) {
      var req = {
        query: {
          index_key: 'abc 123'
        }
      };


      azure.set('myapp:abc123', 'foo').then(function(){
        fetchIndex(req, 'myapp', config).then(function() {
          expect(azureSpy.calledWith('emberdeploy', 'manifest', 'myapp:abc123')).to.be.true;
          expect(azureSpy.calledWith('emberdeploy', 'manifest', 'myapp:abc 123')).to.be.false;
          done();
        }).catch(function(err) {
          done(err);
        });
      });

    });

    it('removes special chars revisionQueryParam', function(done) {
      var req = {
        query: {
          index_key: 'ab@*#!c(@)123'
        }
      };

      azure.set('myapp:abc123', 'foo').then(function(){
        fetchIndex(req, 'myapp').then(function() {
          expect(azureSpy.calledWith('myapp:abc123')).to.be.true;
          expect(azureSpy.calledWith('myapp:ab@*#!c(@)123')).to.be.false;
          done();
        }).catch(function(err) {
          done(err);
        });
      });
    });

    it('fails the promise with a critical error if appName:current is not present', function(done) {
      azure.del('myapp:current').then(function(){
        fetchIndex(basicReq, 'myapp').then(function() {
          done("Promise should not have resolved.");
        }).catch(function(err) {
          expect(azureSpy.calledWith('myapp:current')).to.be.true;
          expect(err.critical).to.be.true;
          done();
        });
      });
    });

    it('fails the promise with a critical error if revision pointed to by appName:current is not present', function(done) {
      azure.set('myapp:current', 'myapp:abc123').then(function(){
        return azure.del('myapp:abc123');
      }).then(function(){
        fetchIndex(basicReq, 'myapp').then(function() {
          done("Promise should not have resolved.");
        }).catch(function(err) {
          expect(azureSpy.calledWith('myapp:current')).to.be.true;
          expect(azureSpy.calledWith('myapp:abc123')).to.be.true;
          expect(err.critical).to.be.true;
          done();
        });
      });
    });

    it('fails the promise with a non-critical error if revision requestd by query param is not present', function(done) {
      req = {
        query: {
          index_key: 'abc123'
        }
      };
      azure.del('myapp:abc123').then(function(){
        fetchIndex(req, 'myapp').then(function() {
          done("Promise should not have resolved.");
        }).catch(function(err) {
          expect(azureSpy.calledWith('myapp:abc123')).to.be.true;
          expect(err.critical).to.be.false;
          done();
        });
      });
    });

    it('resolves the promise with the index html requested', function(done) {
      var currentHtmlString = '<html><body>1</body></html>';
      Bluebird.all([
        azure.set('myapp:current', 'myapp:abc123'),
        azure.set('myapp:abc123', currentHtmlString),
      ]).then(function(){
        fetchIndex(basicReq, 'myapp').then(function(html) {
          expect(azureSpy.calledWith('myapp:current')).to.be.true;
          expect(azureSpy.calledWith('myapp:abc123')).to.be.true;
          expect(html).to.equal(currentHtmlString);
          done();
        }).catch(function(err) {
          done("Promise should not have failed.");
        });
      });
    });

    it('resolves the promise with the index html requested (specific revision)', function(done) {
      var currentHtmlString = '<html><body>1</body></html>';
      var newDeployHtmlString = '<html><body>2</body></html>';
      var req = {
        query: {
          index_key: 'def456'
        }
      };
      Bluebird.all([
        azure.set('myapp:current', 'myapp:abc123'),
        azure.set('myapp:abc123', currentHtmlString),
        azure.set('myapp:def456', newDeployHtmlString)
      ]).then(function(){
        fetchIndex(req, 'myapp').then(function(html) {
          expect(azureSpy.calledWith('myapp:current')).to.be.false;
          expect(azureSpy.calledWith('myapp:abc123')).to.be.false;
          expect(azureSpy.calledWith('myapp:def456')).to.be.true;
          expect(html).to.equal(newDeployHtmlString);
          done();
        }).catch(function(err) {
          done("Promise should not have failed.");
        });
      });
    });
  });
});
