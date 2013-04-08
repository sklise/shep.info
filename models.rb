DataMapper.setup(:default, ENV['DATABASE_URL'] || "postgres://localhost/shep")
DataMapper::Property::String.length(255)

class User
  include DataMapper::Resource

  property :id, Serial
  property :nickname, String, length: 3..24, unique: true
  property :email, String
  property :password, BCryptHash

  property :created_at, DateTime
  property :updated_at, DateTime

  has n, :channels, through: Resource

  def authenticate(attempted_password)
    if self.password == attempted_password
      true
    else
      false
    end
  end

  before :create, :add_channel

  def add_channel
    self.channels << Channel.first(name: "itp")
  end

end

class Channel
  include DataMapper::Resource

  property :id, Serial
  property :created_at, DateTime
  property :updated_at, DateTime
  property :name, String, length: 3..24, unique: true
  property :password, BCryptHash
  property :private, Boolean, default: false

  has n, :users, through: Resource
end

DataMapper.finalize

unless ENV['RACK_ENV'] == 'production'
  DataMapper.auto_upgrade!
end