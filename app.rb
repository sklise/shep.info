class Shep < Sinatra::Base
  set :static, true
  set :logging, true
  set :cache, Dalli::Client.new
  set :enable_cache, true

  get '/' do
    redirect "/channels/itp" if env['warden'].authenticated?
    erb :index
  end

  get '/channels/:channel_name' do
    env['warden'].authenticate!
    erb :chatroom
  end

  post '/nicknames/check' do
    content_type :json
    @user = User.first nickname: params[:nickname]

    if @user.nil?
      {nickname: params[:nickname], available: true}.to_json
    else
      halt 500
    end
  end

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
  #  AUTH                                     #
  #############################################

  post '/auth/unauthenticated' do
    session[:return_to] = env['warden.options'][:attempted_path]
    puts env['warden.options'][:attempted_path]
    flash.error = env['warden'].message || "You must log in"
    redirect '/auth/login'
  end

  get '/auth/login' do
    erb :login
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