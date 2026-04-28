# Liquid filter: render an integer view count with thousands separator and
# a trailing "+" suffix.
#
#   {{ 12       | views_plus }}  -> "12+"
#   {{ 12400    | views_plus }}  -> "12,400+"
#   {{ nil      | views_plus }}  -> "0+"

module Jekyll
  module ViewsFilter
    def views_plus(input)
      n = input.to_i
      formatted = n.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
      "#{formatted}+"
    end
  end
end

Liquid::Template.register_filter(Jekyll::ViewsFilter)
