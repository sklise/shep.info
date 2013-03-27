DataMapper.setup(:default, ENV['DATABASE_URL'] || "postgres://localhost/shep")
DataMapper::Property::String.length(255)

class User
  include DataMapper::Resource

  property :id, Serial
  property :nickname, String, length: 3..32, unique: true
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
end

class Channel
  include DataMapper::Resource

  property :id, Serial
  property :created_at, DateTime
  property :updated_at, DateTime
  property :name, String, length: 3..20, unique: true

  has n, :users, through: Resource
end

DataMapper.finalize

unless ENV['RACK_ENV'] == 'production'
  DataMapper.auto_upgrade!
end