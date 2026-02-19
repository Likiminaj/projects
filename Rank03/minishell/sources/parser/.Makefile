NAME		:= parser_test

CC			:= cc
CFLAGS		:= -Wall -Wextra -Werror -g

ROOT		:= ../..
LIBFT_DIR	:= $(ROOT)/libft
LIBFT_A		:= $(LIBFT_DIR)/libft.a

INCLUDES	:= -I. -I$(LIBFT_DIR)

PARSER_SRCS	:= \
	parser.c \
	parser_utils.c \
	parser_create_redirects.c \
	parser_create_nodes.c \
	parser_create_args.c

TEST_SRCS	:= \
	main_test.c \
	test_tokens.c \
	print_ast.c

SRCS		:= $(PARSER_SRCS) $(TEST_SRCS)
OBJS		:= $(SRCS:.c=.o)

all: $(NAME)

$(LIBFT_A):
	@$(MAKE) -C $(LIBFT_DIR)

$(NAME): $(LIBFT_A) $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) $(LIBFT_A) -o $(NAME)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

clean:
	rm -f $(OBJS)

fclean: clean
	rm -f $(NAME)

re: fclean all

run: all
	./$(NAME)

.PHONY: all clean fclean re run
