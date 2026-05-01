CC = cc
CFLAGS = -Wall -Wextra -Werror

NAME = philo

SRCS = main.c \
	parse.c \
	init.c \
	routine.c \
	monitor.c \
	time.c \
	cleanup.c

OBJS = $(SRCS:.c=.o)

all: $(NAME)

$(NAME): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(NAME)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS)

fclean: clean
	rm -f $(NAME)

re: fclean all

.PHONY: all clean fclean re
