<?php echo '
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="description" content="Interactive Harmonograph - Create your own artwork!">
	<meta property="og:url" content="http://www.ashware.nl/harmonograph/your-harmonogram.php?imageId='.$_REQUEST[imageId].'" />
	<meta property="og:title" content="Create a dazzling harmonogram and share it..."/>
	<meta property="og:image" content="http://www.ashware.nl/harmonograph/img/harmonogram-'.$_REQUEST[imageId].'.gif" />
	<meta property="og:description" content="Interactive Harmonograph - Create your own artwork!" />
	<link rel="image_src" href="http://www.ashware.nl/harmonograph/img/harmonogram-'.$_REQUEST[imageId].'.gif" />
	<title>Create your own harmonogram and share it...</title>
	<style>
		body{
			height:100%;
			background-color:#000;
		}
		h1{
			font:bold 21px / 21px "Trebuchet MS", Arial, Helvetica, sans-serif;
			text-align:center;
		}
		h1 a{
			color:#cc0;
		}
		img{
			display:block;
			position:relative;
			margin:20px auto;
		}
		.addThis{
			position:fixed; 
			left:0; top:0;
		}
	</style>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js"></script>
</head>

<body>
	<h1><a href="http://www.ashware.nl/harmonograph">Create your own harmonogram here</a></h1>
	<img class="harmonogram" src="img/harmonogram-'.$_REQUEST[imageId].'.gif" alt="mijn harmonogram" />
	<div class="addThis">
		<!-- AddThis Button BEGIN -->
		<div class="addthis_toolbox addthis_default_style ">
			<a class="addthis_counter addthis_pill_style"></a>
		</div>
		<script type="text/javascript" src="http://s7.addthis.com/js/250/addthis_widget.js#pubid=ra-4f3c4b976815089f"></script>
		<!-- AddThis Button END -->
	</div>
	
<script type="text/javascript" >
$(function(){
	$(".harmonogram").css("marginTop",($(document).innerHeight()-600)/2);
});
	
</script>
</body>
</html>'; 
?>