unless ActionController::Base.param_parsers[Mime::JSON]
  # assume rails 2.0, which doesn't have a param parser for JSON put/post.
  ActionController::Base.param_parsers[Mime::JSON] = lambda do |body|
    if body.blank?
      {}
    else
      data = ActiveSupport::JSON.decode(body)
      data = {:_json => data} unless data.is_a?(Hash)
      data.with_indifferent_access
    end
  end
end
