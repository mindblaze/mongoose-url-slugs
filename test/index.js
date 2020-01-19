var mongoose = require('mongoose'),
    expect = require('chai').expect,
    urlSlugs = require('../index');

mongoose.connect('mongodb://localhost/mongoose-url-slugs');

mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
});

var maxLength = 20,
    TestObjSchema = new mongoose.Schema({name: String, extra: String}),
    TestObjSparseSchema = new mongoose.Schema({name: String, extra: String}),
    TestObjExcludeSchema = new mongoose.Schema({name: String, extra: String});

TestObjSchema.plugin(urlSlugs('name', {maxLength: maxLength}));
TestObjSparseSchema.plugin(urlSlugs('name', {maxLength: maxLength, indexSparse: true}));
TestObjExcludeSchema.plugin(urlSlugs('name', {maxLength: maxLength, exclude: ['contact']}));

var TestObj = mongoose.model('test_obj', TestObjSchema);
var TestSparseObj = mongoose.model('test_sparse_obj', TestObjSparseSchema);
var TestExcludeObj = mongoose.model('test_exclude_obj', TestObjExcludeSchema);

describe('mongoose-url-slugs', function() {
  before(function(done) {
    TestObj.remove(done);
  });
  before(function(done) {
    TestSparseObj.remove(done);
  });
  before(function(done) {
    TestExcludeObj.remove(done);
  });

  describe('maxLength', function() {
    it('ensures slug length is less than maxLength', function(done) {
      TestObj.create({name: 'super duper long content that cannot possibly fit into a url in any meaningful manner'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).length.to.be(maxLength);
        done();
      });
    });

    it('sequential slugs work with maxLength', function(done) {
      TestObj.create({name: 'super duper long content that cannot possibly fit into a url'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).length.to.be(maxLength);
        TestObj.create({name: 'super duper long content that cannot possibly fit into a url'}, function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2.slug).length.to.be(maxLength);
          done();
        });
      });
    });
  });

  describe('slug numbering', function() {
    it('does not add unnecessary numbers', function(done) {
      TestObj.create({name: 'Foo Bar'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.equal('foo-bar');
        TestObj.create({name: 'Foo'}, function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2.slug).to.equal('foo');
          expect(obj._id.equals(obj2._id)).to.be.false;
          done();
        });
      });
    });
  });

  describe('slug exclusion', function() {
    it('add a number if slug is a reserved word', function(done) {
      TestExcludeObj.create({name: 'Contact'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.equal('contact-1');
        TestExcludeObj.create({name: 'contact'}, function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2.slug).to.equal('contact-2');
          expect(obj._id.equals(obj2._id)).to.be.false;
          done();
        });
      });
    });
  });

  describe('slug', function() {
    it('does not use undefined when slug field was not selected and document was saved', function(done) {
      TestObj.create({name: 'selected', extra: 'test'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.equal('selected');
        TestObj.findOne({name: 'selected'}, 'extra', function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2).to.exist;
          obj2.extra = 'test2';
          obj2.save(function(err, obj3) {
            expect(err).to.not.exist;
            expect(obj3.extra).to.equal('test2');
            TestObj.findOne({name: 'selected'}, function(err, obj4) {
              expect(err).to.not.exist;
              expect(obj4.extra).to.equal('test2');
              expect(obj4.slug).to.equal('selected');
              done();
            });
          });
        });
      });
    });
    it('uses undefined when slug field does not exist but was selected', function(done) {
      TestObj.create({extra: 'test'}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.equal('undefined');
        TestObj.create({extra: 'test2'}, function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2.slug).to.equal('undefined-2');
          expect(obj._id.equals(obj2._id)).to.be.false;
          done();
        });
      });
    });
    it('sets slug to undefined when it is an empty string and was selected', function(done) {
      TestObj.create({name: ''}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.equal('undefined-3');
        done();
      });
    });
  });

  describe('index_sparse', function() {
    it('sets slug to null when it is an empty string', function(done) {
      TestSparseObj.create({name: ''}, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj.slug).to.be.empty;
        TestSparseObj.create({name: ''}, function(err, obj2) {
          expect(err).to.not.exist;
          expect(obj2.slug).to.be.empty;
          expect(obj._id.equals(obj2._id)).to.be.false;
          done();
        });
      });
    });
  });

  it('works', function(done) {
    TestObj.create({name: 'cool stuff'}, function(err, obj) {
      expect(obj.slug).to.equal('cool-stuff');
      TestObj.create({name: 'cool stuff'}, function(err, obj) {
        expect(obj.slug).to.equal('cool-stuff-2');
        TestObj.create({name: 'cool stuff'}, function(err, obj) {
          expect(obj.slug).to.equal('cool-stuff-3');
          done();
        });
      });
    });
  });
});
