var mongoose  = require('mongoose'),
    expect    = require('chai').expect,
    urlSlugs  = require('../index');

mongoose.connect('mongodb://localhost/mongoose-url-slugs');

mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
});

var maxLength     = 20,
    TestObjSchema = new mongoose.Schema({ name : String });

TestObjSchema.plugin(urlSlugs('name', { maxLength : maxLength, index_sparse : true }));

var TestObj = mongoose.model('test_obj', TestObjSchema);

describe('mongoose-url-slugs', function() {
  before(function(done) {
    TestObj.remove(done);
  });

  describe('max_length', function() {
    it('ensures slug length is less than max_length', function(done) {
      TestObj.create({ name : 'super duper long content that cannot possibly fit into a url in any meaningful manner' }, function(err, obj) {
        expect(obj.slug).length.to.be(maxLength);
        done();
      });
    });

    it('sequential slugs work with max_slug_length', function(done) {
      TestObj.create({ name : 'super duper long content that cannot possibly fit into a url' }, function(err, obj) {
        expect(err).to.not.exist
        expect(obj.slug).length.to.be(maxLength);
        TestObj.create({ name : 'super duper long content that cannot possibly fit into a url' }, function(err, obj2) {
          expect(err).to.not.exist
          expect(obj2.slug).length.to.be(maxLength);
          done();
        });
      });
    });
  });

  describe('index_sparse', function() {
    it('sets slug to null when it is an empty string', function(done) {
      TestObj.create({ name : '' }, function(err, testObj) {
        expect(err).to.not.exist
        expect(testObj.slug).to.be.empty
        TestObj.create({ name : '' }, function(err, testObj2) {
          expect(err).to.not.exist
          expect(testObj2.slug).to.be.empty
          expect(testObj._id.equals(testObj2.id)).to.be.false
          done()
        })
      })
    })
  })

  it('works', function(done) {
    TestObj.create({ name : 'cool stuff' }, function(err, obj) {
      expect(obj.slug).to.equal('cool-stuff');
      TestObj.create({ name : 'cool stuff' }, function(err, obj) {
        expect(obj.slug).to.equal('cool-stuff-2');
        TestObj.create({ name : 'cool stuff' }, function(err, obj) {
          expect(obj.slug).to.equal('cool-stuff-3');
          done();
        });
      });
    });
  });
});