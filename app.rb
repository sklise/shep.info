require 'bundler'
Bundler.require

require './models'

class Shep < Sinatra::Base
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

  set :static, true
  set :logging, true
  set :cache, Dalli::Client.new
  set :enable_cache, true

  get '/' do
    redirect "/channels/itp" if env['warden'].authenticated?
    erb :index
  end

  # This is the view for all channels.
  get '/channels/:channel_name' do
    env['warden'].authenticate!
    erb :chatroom
  end

  # Check to see if a nickname is available
  post '/nicknames/check' do
    content_type :json
    @user = User.first nickname: params[:nickname]

    if @user.nil?
      {nickname: params[:nickname], available: true}.to_json
    else
      halt 500
    end
  end

  # Create a new User. For Sign Ups.
  post '/users' do
    content_type :json

    @user = User.new(JSON.parse(request.body.read))

    if @user.save
      env['warden'].set_user @user
      @user.to_json
    else
      halt 500
    end
  end

  #############################################
  #                  AUTH                     #
  #############################################

  post '/auth/unauthenticated' do
    session[:return_to] = env['warden.options'][:attempted_path]
    puts env['warden.options'][:attempted_path]
    flash.error = env['warden'].message || "You must log in"
    redirect '/auth/login'
  end

  get '/auth/login' do
    erb :index
  end

  post '/auth/login' do
    env['warden'].authenticate!

    flash.success = env['warden'].message

    if session[:return_to].nil?
      redirect '/'
    else
      redirect session[:return_to]
    end
  end

  get '/auth/logout' do
    env['warden'].raw_session.inspect
    env['warden'].logout
    flash.success = 'Successfully logged out'
    redirect '/'
  end
end