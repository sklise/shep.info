require 'bundler'
Bundler.require

require './models'
require './app'

builder = Rack::Builder.new do
  use Rack::Session::Cookie, secret: ENV['SESSION_SECRET']
  use Rack::Flash, accessorize: [:error, :success]

  use Warden::Manager do |config|
    config.serialize_into_session{|user| user.id }
    config.serialize_from_session{|id| User.get(id) }

    config.scope_defaults :default,
      strategies: [:password],
      action: 'auth/unauthenticated'
    config.failure_app = self
  end

  Warden::Manager.before_failure do |env,opts|
    env['REQUEST_METHOD'] = 'POST'
  end

  Warden::Strategies.add(:password) do
    def valid?
      params['user'] && params['user']['username'] && params['user']['password']
    end

    def authenticate!
      user = User.first(username: params['user']['username'])

      if user.nil?
        fail!("The username you entered does not exist.")
        flash.error = ""
      elsif user.authenticate(params['user']['password'])
        flash.success = "Successfully Logged In"
        success!(user)
      else
        fail!("Could not log in")
      end
    end
  end

  map('/') { run Shep }
end

run builder