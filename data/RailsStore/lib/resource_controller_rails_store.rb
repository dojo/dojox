module ResourceController
  module ActionControllerExtension    
    def resource_controller_rails_store(options={})
      self.class_eval do
        include ResourceController::DojoPagination
        
        self.rails_store_pagination_options.merge!(options)
        
        index.wants.json do
          set_content_range_header
          render :json => collection.to_json
        end
        
        show.wants.json do
          render :json => object.to_json
        end
        
        create.wants.json do
          render :json => object
        end
        
        create.failure.wants.json do
          render :json => object.errors, :status => :unprocessable_entity
        end
        
        update.wants.json do
          render :json => object
        end
        
        update.failure.wants.json do
          render :json => object.errors, :status => :unprocessable_entity
        end
        
        destroy.wants.json do
          head :ok
        end
        
        destroy.failure.wants.json do
          head :unprocessable_entity
        end
        
      end
    end
  end

  module DojoPagination
    def collection
      options = rails_store_sorting(rails_store_range_header(self.class.rails_store_pagination_options))
      end_of_association_chain.find(:all, options)
    end
  end
end
