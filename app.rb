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
      params['nickname'] && params['password']
    end

    def authenticate!
      user = User.first(nickname: params['nickname'])

      if user.nil?
        fail!("The nickname you entered does not exist.")
        # flash.error = ""
      elsif user.authenticate(params['password'])
        # flash.success = "Successfully Logged In"
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
    erb :index, layout: false
  end

  # This is the view for all channels.
  get '/channels/:name' do
    env['warden'].authenticate!

    @channel = Channel.first_or_create name: params[:name]
    env['warden'].user.channels << @channel unless env['warden'].user.channels.include?(@channel)
    env['warden'].user.save

    erb :chatroom
  end

  # Check to see if a nickname is available
  post '/nicknames/check' do
    content_type :json
    @user = User.first nickname: params[:nickname]

    if @user.nil? || @user.password.nil?
      {nickname: params[:nickname], available: true}.to_json
    else
      halt 500
    end
  end

  # Create a new User. For Sign Ups.
  post '/users' do
    content_type :json

    user_data = JSON.parse(request.body.read)
    user_data.delete('password') if user_data['password'] == ""

    @user = User.first_or_create(nickname: user_data['nickname'])

    @user.password = user_data['password'] if user_data['password']

    if @user.save
      env['warden'].set_user @user
      @user.to_json
    else
      halt 500
    end
  end

  get '/shep/help' do
    require 'net/http'
    help_uri = URI.parse("#{ENV['HUBOT_DOMAIN']}/shep/help")
    Net::HTTP.get(help_uri)
  end

  get '/users/:id' do
    content_type :json
    @user = User.first(id: params[:id])

    if @user.nil?
      halt 404
    else
      @user.to_json(relationships: {channels: {include: [:name]}})
    end
  end

  put '/users/:id' do
    content_type :json
    @user = User.first(id: params[:id])

    user_data = JSON.parse(request.body.read)
    @user.update user_data
  end

  #############################################
  #                CHANNELS                   #
  #############################################
  get '/api/channels' do
    content_type :json
    @channels = Channel.all(private: false)

    @channels.to_json
  end

  post '/api/channels/add/:channel_name' do
    content_type :json

    @channel = Channel.first_or_create(name: params[:channel_name])
    env['warden'].user.channels << @channel
    env['warden'].user.save
    @channel.to_json
  end

  post '/api/channels' do
    content_type :json
    channel_data = JSON.parse(request.body.read)

    @channel = Channel.first(name: channel_data['channel'])

    if @channel.nil?
      @channel = Channel.create(name: channel_data['channel'])
      env['warden'].user.channels << @channel
      env['warden'].user.save
      @channel.to_json
    elsif @channel.private
      halt 401
    else
      @channel.to_json
    end
  end

  get '/api/channels/:id' do
    content_type :json

    @channel = Channel.first(id: params[:id])

    if @channel.nil?
      halt 404
    else
      @channel.to_json
    end
  end

  #############################################
  #                  AUTH                     #
  #############################################

  post '/auth/unauthenticated' do
    session[:return_to] = env['warden.options'][:attempted_path]
    puts env['warden.options'][:attempted_path]
    # flash.error = env['warden'].message || "You must log in"
    redirect '/auth/login'
  end

  get '/auth/login' do
    erb :index, layout: false
  end

  post '/auth/login' do
    env['warden'].authenticate!

    # flash.success = env['warden'].message

    if session[:return_to].nil?
      redirect '/channels/itp'
    else
      puts session[:return_to]
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