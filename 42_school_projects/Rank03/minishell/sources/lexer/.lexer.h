/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   .lexer.h                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/26 15:00:00 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/11 16:55:59 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef LEXER_H
# define LEXER_H

# include <stdlib.h>

/* TOKEN TYPES */
typedef enum e_token_type
{
	TOKEN_WORD,
	TOKEN_PIPE,
	TOKEN_REDIRECT_IN,
	TOKEN_REDIRECT_OUT,
	TOKEN_REDIRECT_APPEND,
	TOKEN_HEREDOC,
}	t_token_type;

typedef struct s_token
{
	t_token_type	type;
	char			*word;
	struct s_token	*next;
}	t_token;

/* LEXER FUNCTIONS */
t_token	*ft_lex(char *line, int *exit_status);
void	ft_free_tokens(t_token **list);
void	ft_malloc_error(int *exit_status);

/* HELPER FUNCTIONS (from libft) */
int		ft_isspace(char c);
int		ft_isoperator(int c);
int		ft_wordlen(char *line, int i);
void	ft_putendl_fd(char *s, int fd);
char	*ft_substr(char const *s, unsigned int start, size_t len);

#endif
