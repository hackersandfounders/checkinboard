.PHONY: gulp rsync deploy

deploy: gulp rsync

gulp:
	gulp

rsync: 
	rsync -uva dist/ building:public_html/board
