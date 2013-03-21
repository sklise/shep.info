DataMapper.setup(:default, ENV['DATABASE_URL'] || "postgres://localhost/shep")
DataMapper::Property::String.length(255)


class User
  include DataMapper::Resource

  property :id, Serial
  property :nickname, String, length: 3..32, unique: true
  property :email, String
  property :password, BCryptHash

  def authenticate(attempted_password)
    if self.password == attempted_password
      true
    else
      false
    end
  end
end

DataMapper.finalize

unless ENV['RACK_ENV'] == 'production'
  DataMapper.auto_upgrade!
end