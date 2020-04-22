# coschedule
a monolithic cat app

# How to get setup

  - Run create database '/createdb' route first.
  - Then uncomment the database name in the mysql connection.
  - Run each (3) create table routes (users, favorites, comments).
  - Create username and password hit register button.
  - login with your newly created user.
  
# How to use
  - Press "more cats" button to see a new cat.
  - The drop downs can be used one at a time for user search results.
  - Click the "favorite" button to favorite a cat.
  - Under favorites the "show" button will bring you to the favorites show page.
  - Writing a comment will add a comment below the picture.
  - Click the show button under the favorite again to view the updated comment.
  - Delete button will delete the favorite.
  - Everytime you write a new comment it will update automatically.
  
 # Notes, bugs, and other things
  - Day 2 I ran into a pretty frustraiting bug with express.
  - It was recalling my entire app based on a CSS file.
  - I had tons of errors with nothing pointing to why this was happening.
  - It took a very long time (days) to figure out why everything started failing.
  - Then I ran into another bug with the Pug template language.
  - It randomly started not finding templates.
  - Then it was unable to find itself. 
  - Some weird obscure line fixed it.
  - Moral of the story I was fighting against bugs the whole time.
  - So this code is not of my best work.
  - I was mostly fighting the clock doing all I could to ship something on time.
  - This app has some bugs I created.
  - First if you try to login without a user an error is thrown vs a redirect.
  - Dont have time to fix it so I have to ship it as is (unfortunetly). 
  - Second, you have to click the show button on the favorites to view the updated comment.
  - You should just redirect to that page and not have to leave.
  
