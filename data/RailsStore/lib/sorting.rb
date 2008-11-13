module RailsStore
  module Sorting
    def rails_store_sorting(options={})
      if !params[:sortBy].blank? and !params[:sortDir].blank?
        transposed = [params[:sortBy].to_a, params[:sortDir].to_a].transpose
        
        order = transposed.map do |sorting|
          if model_object.column_names.include?(sorting[0])
            "#{model_object.table_name}.#{sorting[0]} #{sorting[1]}"
          else
            nil
          end
        end.compact.join(', ')
        
        options[:order] = order unless order.blank?
      end
      
      options[:order] ||= "#{model_object.table_name}.#{model_object.primary_key} ASC"
      
      return options
    end
  end
end
