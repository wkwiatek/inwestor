var makeDisqus = function(id){
    if (typeof(DISQUS) != "undefined"){
      DISQUS.reset({
        reload: true,
        config: function () {  
          this.page.identifier = id + 'x';
          this.page.url = 'http://example.com/#!' + id + 'x';
      this.page.title = id + '';
      this.page.language = 'pl';
        }
      });
    }
};

var disqus_shortname = 'inwestor';
var disqus_identifier = 'newidentifier';
var disqus_url = 'http://example.com/newthread';
var disqus_developer = '1';


var disqus_config = function () { 
  this.language = "pl";
};
/* * * DON'T EDIT BELOW THIS LINE * * */
(function() {
	var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
})();

