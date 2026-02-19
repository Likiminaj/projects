# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/02/11 16:20:39 by lraghave          #+#    #+#              #
#    Updated: 2026/02/19 17:52:22 by lraghave         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#Parameters
NAME		= minishell
CC          = cc
CFLAGS      = -Wall -Wextra -Werror

LDLIBS      = -lreadline -lhistory

LIBFT_DIR   = libft
LIBFT		= $(LIBFT_DIR)/libft.a

SOURCES = \
    sources/ast_expansion/ast_expansion.c \
    sources/ast_expansion/ast_expansion_command_utils.c \
    sources/ast_expansion/ast_expansion_utils.c \
    sources/ast_expansion/ast_expansion_command.c \
    sources/ast_expansion/ast_expansion_redirections.c \
    sources/built_in/built_in_cd.c \
    sources/built_in/built_in_env.c \
    sources/built_in/built_in_export.c \
    sources/built_in/built_in_pwd.c \
    sources/built_in/built_in_unset.c \
    sources/built_in/built_in_echo.c \
    sources/built_in/built_in_exit.c \
    sources/built_in/built_in_export_utils.c \
    sources/built_in/built_in_var_utils.c \
    sources/errors/errors.c \
    sources/execution/exec_command.c \
    sources/execution/exec_command_utils.c \
    sources/execution/exec_pipe.c \
    sources/execution/execution.c \
    sources/execution/redirections.c \
    sources/lexer/lexer.c \
    sources/lexer/lexer_helpers.c \
    sources/lexer/lexer_helpers2.c \
    sources/parser/parser.c \
    sources/parser/parser_create_args.c \
    sources/parser/parser_create_nodes.c \
    sources/parser/parser_create_redirects.c \
    sources/parser/parser_utils.c \
    sources/setup/init_free_env.c \
    sources/setup/signals.c \
	sources/main.c

OBJECTS = $(SOURCES:.c=.o)

#Commands
all: $(LIBFT) $(NAME)

$(LIBFT):
	make -C $(LIBFT_DIR)

$(NAME): $(OBJECTS)
	$(CC) $(CFLAGS) $(OBJECTS) $(LIBFT) $(LDLIBS) -o $(NAME)

%.o: %.c
	$(CC) $(CFLAGS) -I$(LIBFT_DIR) -c $< -o $@

clean:
	rm -f $(OBJECTS)
	make -C $(LIBFT_DIR) clean

fclean: clean
	rm -f $(NAME)
	make -C $(LIBFT_DIR) fclean

re: fclean all

.PHONY: all clean fclean re
