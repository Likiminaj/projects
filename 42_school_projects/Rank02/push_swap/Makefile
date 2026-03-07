NAME = push_swap
CC = cc
CFLAGS = -Wall -Wextra -Werror
RM = rm -f

SRCS = push_swap.c \
	helpers/ft_helper.c \
	parser/ft_build_stack.c \
	parser/ft_validate.c \
	parser/ft_is_sorted.c \
	operations/ft_push.c \
	operations/ft_swap.c \
	operations/ft_rotate.c \
	operations/ft_reverse_rotate.c \
	sorters/ft_sort_stack.c \
	sorters/ft_sort_three.c \
	sorters/ft_sort_small.c \
	sorters/ft_sort_large_radix.c \

OBJS = $(SRCS:.c=.o)

all: $(NAME)

$(NAME): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(NAME)

%.o: %.c push_swap.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	$(RM) $(OBJS)

fclean: clean
	$(RM) $(NAME)

re: fclean all

.PHONY: all clean fclean re
