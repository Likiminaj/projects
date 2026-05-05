CC = cc
CFLAGS = -Wall -Wextra -Werror -Iincludes

NAME = philo

SRC_DIR = sources

SRCS = $(SRC_DIR)/main.c \
       $(SRC_DIR)/parse.c \
       $(SRC_DIR)/init.c \
       $(SRC_DIR)/routine.c \
       $(SRC_DIR)/monitor.c \
       $(SRC_DIR)/time.c \
       $(SRC_DIR)/cleanup.c

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
